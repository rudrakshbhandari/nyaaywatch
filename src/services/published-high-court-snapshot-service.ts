import { basename } from "node:path";

import type { AppConfig } from "../config/env.js";
import type { HighCourtSnapshotCandidate } from "../domain/high-court-snapshot-candidate-schema.js";
import type { HighCourtCaptureBundle } from "../domain/high-court-capture-schema.js";
import type { HighCourtPublishedSnapshot } from "../domain/high-court-snapshot-schema.js";
import { HighCourtSnapshotCandidateSchema } from "../domain/high-court-snapshot-candidate-schema.js";
import { extractHighCourtCaptureBundle } from "../extract/high-court-njdg-html.js";
import type { HighCourtProfile } from "../high-courts.js";
import type { HighCourtSourceClient } from "../ingest/high-court-source-client.js";
import { sha256 } from "../lib/hash.js";
import { createId } from "../lib/ids.js";
import { logError, logInfo } from "../lib/logger.js";
import {
  buildHighCourtSnapshotCandidate,
  materializeHighCourtPublishedSnapshot,
} from "../normalize/high-court-snapshot-candidate.js";
import { PublicCacheInvalidationService } from "./public-cache-invalidation.js";
import { getRequestPublication, rememberRequestPublication } from "../lib/publication-request-context.js";
import type { ArtifactStore } from "../storage/artifact-store.js";
import {
  PgWarehouseStore,
  type ArtifactRecord,
  type HighCourtPublishedSnapshotRecord,
  type PublicationRecord,
  type RunRecord,
} from "../storage/postgres.js";

const RAW_CAPTURE_ARTIFACT_TYPE = "raw-high-court-html-bundle";
const SNAPSHOT_CANDIDATE_ARTIFACT_TYPE = "high-court-snapshot-candidate-json";

export interface HighCourtRunInspection {
  run: RunRecord;
  artifacts: ArtifactRecord[];
  candidate: HighCourtSnapshotCandidate | null;
  publishedSnapshot: HighCourtPublishedSnapshotRecord | null;
}

export interface HighCourtPublicationHistoryEntry {
  publication: PublicationRecord;
  snapshot: HighCourtPublishedSnapshot["snapshot"] & { id: string };
  stats: Pick<HighCourtPublishedSnapshot["stats"], "pendingTotalCases" | "disposedLastMonthTotalCases">;
  run: Pick<RunRecord, "id" | "status" | "replayOfRunId" | "sourceSnapshotAt" | "methodologyVersion" | "qualityState">;
  isActive: boolean;
}

export class PublishedHighCourtSnapshotService {
  private readonly cacheInvalidation: PublicCacheInvalidationService;

  constructor(
    private readonly config: AppConfig,
    private readonly profile: HighCourtProfile,
    private readonly store: PgWarehouseStore,
    private readonly artifactStore: ArtifactStore,
    private readonly sourceClient: HighCourtSourceClient,
  ) {
    this.cacheInvalidation = new PublicCacheInvalidationService(config);
  }

  async getPublishedSnapshot(): Promise<HighCourtPublishedSnapshotRecord | null> {
    const scope = `court:${this.profile.courtCode}`;
    const requestPublication = getRequestPublication<HighCourtPublishedSnapshotRecord>(scope);
    if (requestPublication) {
      return requestPublication;
    }
    const record = await this.store.getLatestHighCourtPublishedSnapshot(this.profile.courtCode, "high_court");
    if (record) {
      rememberRequestPublication(scope, record);
    }
    return record;
  }

  async getStats(): Promise<{ snapshot: HighCourtPublishedSnapshot["snapshot"]; stats: HighCourtPublishedSnapshot["stats"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, stats: record.payload.stats } : null;
  }

  async getTrends(): Promise<{ snapshot: HighCourtPublishedSnapshot["snapshot"]; trends: HighCourtPublishedSnapshot["trends"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, trends: record.payload.trends } : null;
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns(this.profile.courtCode, "high_court");
  }

  async listPublications(): Promise<PublicationRecord[]> {
    return this.store.listPublications(this.profile.courtCode, "high_court");
  }

  async listPublicationHistory(): Promise<HighCourtPublicationHistoryEntry[]> {
    const publications = await this.store.listPublications(this.profile.courtCode, "high_court");
    const entries = await Promise.all(
      publications.map(async (publication, index) => {
        const snapshot = await this.store.getHighCourtPublishedSnapshotById(publication.publishedSnapshotId);
        if (!snapshot) {
          throw new Error(`High Court published snapshot ${publication.publishedSnapshotId} was not found.`);
        }

        const run = await this.store.getRunById(snapshot.runId);
        if (!run) {
          throw new Error(`Run ${snapshot.runId} was not found for published snapshot ${snapshot.id}.`);
        }

        return {
          publication,
          snapshot: {
            id: snapshot.id,
            ...snapshot.payload.snapshot,
          },
          stats: {
            pendingTotalCases: snapshot.payload.stats.pendingTotalCases,
            disposedLastMonthTotalCases: snapshot.payload.stats.disposedLastMonthTotalCases,
          },
          run: {
            id: run.id,
            status: run.status,
            replayOfRunId: run.replayOfRunId,
            sourceSnapshotAt: run.sourceSnapshotAt,
            methodologyVersion: run.methodologyVersion,
            qualityState: run.qualityState,
          },
          isActive: index === 0,
        } satisfies HighCourtPublicationHistoryEntry;
      }),
    );

    return entries;
  }

  async inspectRun(runId: string): Promise<HighCourtRunInspection | null> {
    const run = await this.store.getRunById(runId);
    if (!run || !belongsToHighCourtScope(run, this.profile.courtCode)) {
      return null;
    }

    const artifacts = await this.store.listArtifactsForRun(runId);
    const candidateArtifact = artifacts.find((artifact) => artifact.artifactType === SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);
    const candidate = candidateArtifact
      ? HighCourtSnapshotCandidateSchema.parse(
          await this.artifactStore.downloadJson(candidateArtifact.s3Key, {
            expectedChecksumSha256: candidateArtifact.checksumSha256,
          }),
        )
      : null;

    return {
      run,
      artifacts,
      candidate,
      publishedSnapshot: await this.store.getHighCourtSnapshotForRun(runId),
    };
  }

  async captureRun(note?: string): Promise<HighCourtRunInspection> {
    await this.artifactStore.ensureBucket();
    logInfo("high_court_operator_fetch_started", {
      courtCode: this.profile.courtCode,
      note: note ?? null,
    });

    const bundle = await this.sourceClient.captureLatest();
    const extracted = extractHighCourtCaptureBundle(bundle);
    const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
    const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";
    const run = await this.store.insertRun({
      id: createId("run"),
      stateCode: this.profile.courtCode,
      scopeType: "high_court",
      scopeCode: this.profile.courtCode,
      sourceLabel: extracted.sourceName,
      sourceSnapshotAt: referenceDateAt,
      methodologyVersion: "2026.04-high-court-draft",
      status: "pending",
      qualityState: "partial",
      note: note ?? `Captured the latest HC NJDG ${this.profile.courtName} dashboard page.`,
    });

    try {
      const rawArtifact = await this.artifactStore.uploadJson(
        buildRawArtifactKey(this.config.DEPLOY_ENV, this.profile.courtCode, run.id, referenceDateAt),
        bundle,
        {
          source: "hc-njdg",
          capturedat: bundle.capturedAt,
          referencedateat: referenceDateAt,
          referencedatekind: referenceDateKind,
          benchcount: String(bundle.benchOptions.length),
        },
      );

      await this.store.insertArtifact({
        id: createId("artifact"),
        runId: run.id,
        artifactType: RAW_CAPTURE_ARTIFACT_TYPE,
        s3Bucket: rawArtifact.bucket,
        s3Key: rawArtifact.key,
        checksumSha256: rawArtifact.checksumSha256,
        sizeBytes: rawArtifact.sizeBytes,
        metadata: {
          source: "hc-njdg",
          capturedAt: bundle.capturedAt,
          referenceDateAt,
          referenceDateKind,
          benchCount: bundle.benchOptions.length,
          sourceSnapshotAt: extracted.sourceSnapshotAt,
        },
      });

      await this.buildAndStoreSnapshotCandidate(run.id, rawArtifact.key, rawArtifact.checksumSha256, note);
      const inspection = await this.inspectRun(run.id);
      if (!inspection) {
        throw new Error(`Run ${run.id} was not found after High Court capture.`);
      }

      logInfo("high_court_operator_fetch_completed", {
        runId: run.id,
        referenceDateAt,
        referenceDateKind,
        qualityState: inspection.run.qualityState,
        artifactCount: inspection.artifacts.length,
      });

      return inspection;
    } catch (error) {
      logError("high_court_operator_fetch_failed", {
        courtCode: this.profile.courtCode,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(run.id, {
        status: "failed",
        note: buildFailureNote("High Court capture failed", error),
      });
      throw error;
    }
  }

  async publishRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: HighCourtPublishedSnapshotRecord }> {
    logInfo("high_court_operator_publish_started", {
      runId,
      note: note ?? null,
    });
    const inspection = await this.inspectRun(runId);
    if (!inspection) {
      throw new Error(`Run ${runId} was not found.`);
    }

    assertPublishableRun(inspection);
    const payload = materializeHighCourtPublishedSnapshot(
      inspection.candidate,
      new Date().toISOString(),
      runId,
      inspection.run.replayOfRunId ?? undefined,
    );

    const result = await this.store.withTransaction(async (tx) => {
      const snapshot = await tx.insertHighCourtPublishedSnapshot({
        id: createId("snapshot"),
        runId,
        stateCode: this.profile.courtCode,
        scopeType: "high_court",
        scopeCode: this.profile.courtCode,
        payloadVersion: 1,
        payload,
        checksumSha256: sha256(JSON.stringify(payload)),
      });

      const previousPublication = await tx.getLatestPublication(this.profile.courtCode, "high_court");
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: this.profile.courtCode,
        scopeType: "high_court",
        scopeCode: this.profile.courtCode,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: note ?? defaultPublishNote(inspection.run),
        previousPublicationId: previousPublication?.id ?? null,
      });

      const run = await tx.updateRun(runId, {
        status: inspection.run.replayOfRunId ? "replayed" : "published",
        qualityState: inspection.run.qualityState,
      });

      logInfo("high_court_operator_publish_completed", {
        runId,
        publicationId: publication.id,
        snapshotId: snapshot.id,
        action: publication.action,
        replayOfRunId: inspection.run.replayOfRunId ?? null,
      });

      return { run, publication, snapshot };
    });

    await this.cacheInvalidation.invalidateHighCourtRoutes(this.profile);

    return result;
  }

  async replayRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: HighCourtPublishedSnapshotRecord }> {
    logInfo("high_court_operator_replay_started", {
      sourceRunId: runId,
      note: note ?? null,
    });
    const sourceInspection = await this.inspectRun(runId);
    if (!sourceInspection) {
      throw new Error(`Run ${runId} was not found.`);
    }

    const rawArtifact = requireArtifact(sourceInspection.artifacts, RAW_CAPTURE_ARTIFACT_TYPE);
    await this.artifactStore.ensureBucket();

    const replayRun = await this.store.insertRun({
      id: createId("run"),
      stateCode: sourceInspection.run.stateCode,
      scopeType: "high_court",
      scopeCode: this.profile.courtCode,
      sourceLabel: sourceInspection.run.sourceLabel,
      sourceSnapshotAt: sourceInspection.run.sourceSnapshotAt,
      methodologyVersion: sourceInspection.run.methodologyVersion,
      status: "pending",
      qualityState: sourceInspection.run.qualityState,
      replayOfRunId: sourceInspection.run.id,
      note: note ?? `Replay of ${sourceInspection.run.id}`,
    });

    try {
      const copiedArtifact = await this.artifactStore.copyObject(
        rawArtifact.s3Key,
        buildReplayRawArtifactKey(this.config.DEPLOY_ENV, this.profile.courtCode, replayRun.id, rawArtifact.s3Key),
        {
          checksumsha256: rawArtifact.checksumSha256,
          replayofrunid: sourceInspection.run.id,
        },
      );

      await this.store.insertArtifact({
        id: createId("artifact"),
        runId: replayRun.id,
        artifactType: RAW_CAPTURE_ARTIFACT_TYPE,
        s3Bucket: copiedArtifact.bucket,
        s3Key: copiedArtifact.key,
        checksumSha256: copiedArtifact.checksumSha256 || rawArtifact.checksumSha256,
        sizeBytes: copiedArtifact.sizeBytes || rawArtifact.sizeBytes,
        metadata: {
          replayOfRunId: sourceInspection.run.id,
          sourceArtifactId: rawArtifact.id,
        },
      });

      await this.buildAndStoreSnapshotCandidate(
        replayRun.id,
        copiedArtifact.key,
        copiedArtifact.checksumSha256 || rawArtifact.checksumSha256,
        note,
      );
      const replayResult = await this.publishRun(replayRun.id, note ?? `Replay publish of ${sourceInspection.run.id}`);
      logInfo("high_court_operator_replay_completed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        publicationId: replayResult.publication.id,
        snapshotId: replayResult.snapshot.id,
      });
      return replayResult;
    } catch (error) {
      logError("high_court_operator_replay_failed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(replayRun.id, {
        status: "failed",
        note: buildFailureNote("High Court replay failed", error),
      });
      throw error;
    }
  }

  async rollbackPublication(publicationId: string, note?: string): Promise<PublicationRecord> {
    logInfo("high_court_operator_rollback_started", {
      targetPublicationId: publicationId,
      note: note ?? null,
    });
    const target = await this.store.getPublicationById(publicationId);
    if (!target) {
      throw new Error(`Publication ${publicationId} was not found.`);
    }
    if (!belongsToHighCourtScope(target, this.profile.courtCode)) {
      throw new Error(`Publication ${publicationId} does not belong to ${this.profile.courtCode}.`);
    }

    const latest = await this.store.getLatestPublication(this.profile.courtCode, "high_court");
    if (!latest) {
      throw new Error("Rollback requires an existing publication history.");
    }

    const targetSnapshot = await this.store.getHighCourtPublishedSnapshotById(target.publishedSnapshotId);
    if (!targetSnapshot) {
      throw new Error(`High Court published snapshot ${target.publishedSnapshotId} was not found.`);
    }

    const rollback = await this.store.insertPublication({
      id: createId("publication"),
      stateCode: this.profile.courtCode,
      scopeType: "high_court",
      scopeCode: this.profile.courtCode,
      publishedSnapshotId: targetSnapshot.id,
      action: "rollback",
      note: note ?? `Rollback to publication ${target.id}`,
      previousPublicationId: latest.id,
    });

    logInfo("high_court_operator_rollback_completed", {
      targetPublicationId: publicationId,
      rollbackPublicationId: rollback.id,
      restoredSnapshotId: rollback.publishedSnapshotId,
      previousPublicationId: rollback.previousPublicationId,
    });

    await this.cacheInvalidation.invalidateHighCourtRoutes(this.profile);

    return rollback;
  }

  private async buildAndStoreSnapshotCandidate(
    runId: string,
    rawArtifactKey: string,
    rawArtifactChecksumSha256: string,
    note?: string,
  ): Promise<HighCourtSnapshotCandidate> {
    const bundle = await this.artifactStore.downloadJson<HighCourtCaptureBundle>(rawArtifactKey, {
      expectedChecksumSha256: rawArtifactChecksumSha256,
    });
    const extracted = extractHighCourtCaptureBundle(bundle);
    if (extracted.institutedLastMonth === null || extracted.disposedLastMonth === null) {
      logInfo("high_court_monthly_metric_carried_forward", {
        courtCode: this.profile.courtCode,
        runId,
        reason: "source-not-published",
        institutedCarriedForward: extracted.institutedLastMonth === null,
        disposedCarriedForward: extracted.disposedLastMonth === null,
      });
    }
    const previousSnapshots = await this.loadHistoricalSnapshots();
    const candidate = buildHighCourtSnapshotCandidate(extracted, previousSnapshots);

    const storedCandidate = await this.artifactStore.uploadJson(
      buildCandidateArtifactKey(this.config.DEPLOY_ENV, this.profile.courtCode, runId, candidate.snapshot.referenceDateAt),
      candidate,
      {
        source: "normalized-high-court",
        methodologyversion: candidate.snapshot.methodologyVersion,
        referencedateat: candidate.snapshot.referenceDateAt,
        referencedatekind: candidate.snapshot.referenceDateKind,
      },
    );

    await this.store.insertArtifact({
      id: createId("artifact"),
      runId,
      artifactType: SNAPSHOT_CANDIDATE_ARTIFACT_TYPE,
      s3Bucket: storedCandidate.bucket,
      s3Key: storedCandidate.key,
      checksumSha256: storedCandidate.checksumSha256,
      sizeBytes: storedCandidate.sizeBytes,
      metadata: {
        referenceDateAt: candidate.snapshot.referenceDateAt,
        referenceDateKind: candidate.snapshot.referenceDateKind,
        sourceSnapshotAt: candidate.snapshot.sourceSnapshotAt,
        methodologyVersion: candidate.snapshot.methodologyVersion,
      },
    });

    await this.store.updateRun(runId, {
      status: "completed",
      qualityState: candidate.snapshot.qualityState,
      note,
    });

    return candidate;
  }

  private async loadHistoricalSnapshots(): Promise<HighCourtPublishedSnapshot[]> {
    const publications = await this.store.listPublications(this.profile.courtCode, "high_court");
    const snapshots: HighCourtPublishedSnapshot[] = [];
    const seenSnapshotIds = new Set<string>();

    for (const publication of publications) {
      if (seenSnapshotIds.has(publication.publishedSnapshotId)) {
        continue;
      }

      seenSnapshotIds.add(publication.publishedSnapshotId);
      const snapshot = await this.store.getHighCourtPublishedSnapshotById(publication.publishedSnapshotId);
      if (snapshot) {
        snapshots.push(snapshot.payload);
      }
    }

    // Returned in publication-event recency order (most recently published / currently
    // active first), because listPublications is ordered created_at DESC and we keep the
    // first occurrence per snapshot. buildHighCourtSnapshotCandidate relies on this order
    // to carry forward the active value across rollbacks/corrections; trend building
    // re-sorts chronologically on its own.
    return snapshots;
  }
}

function assertPublishableRun(
  inspection: HighCourtRunInspection,
): asserts inspection is HighCourtRunInspection & { candidate: HighCourtSnapshotCandidate } {
  if (inspection.run.status !== "completed") {
    throw new Error(`Run ${inspection.run.id} is not ready to publish. Current status: ${inspection.run.status}.`);
  }

  if (inspection.run.qualityState === "partial") {
    throw new Error(`Run ${inspection.run.id} is incomplete and cannot be published.`);
  }

  requireArtifact(inspection.artifacts, RAW_CAPTURE_ARTIFACT_TYPE);
  requireArtifact(inspection.artifacts, SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);

  if (!inspection.candidate) {
    throw new Error(`Run ${inspection.run.id} does not have a valid High Court snapshot candidate.`);
  }
}

function requireArtifact(artifacts: ArtifactRecord[], artifactType: string): ArtifactRecord {
  const artifact = artifacts.find((item) => item.artifactType === artifactType);
  if (!artifact) {
    throw new Error(`Run is missing required artifact: ${artifactType}.`);
  }

  return artifact;
}

function buildRawArtifactKey(
  deployEnv: AppConfig["DEPLOY_ENV"],
  courtCode: string,
  runId: string,
  referenceDateAt: string,
): string {
  return [
    "raw",
    deployEnv,
    "high-courts",
    courtCode.toLowerCase(),
    referenceDateAt.slice(0, 10),
    `${runId}-hc-njdg-dashboard-html.json`,
  ].join("/");
}

function buildCandidateArtifactKey(
  deployEnv: AppConfig["DEPLOY_ENV"],
  courtCode: string,
  runId: string,
  referenceDateAt: string,
): string {
  return [
    "normalize",
    deployEnv,
    "high-courts",
    courtCode.toLowerCase(),
    referenceDateAt.slice(0, 10),
    `${runId}-high-court-snapshot-candidate.json`,
  ].join("/");
}

function buildReplayRawArtifactKey(
  deployEnv: AppConfig["DEPLOY_ENV"],
  courtCode: string,
  runId: string,
  sourceKey: string,
): string {
  return ["raw", deployEnv, "high-courts", courtCode.toLowerCase(), "replays", runId, basename(sourceKey)].join("/");
}

function defaultPublishNote(run: RunRecord): string {
  return run.replayOfRunId ? `Replay publish of ${run.replayOfRunId}` : `Published completed High Court run ${run.id}`;
}

function buildFailureNote(prefix: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : "Unexpected error";
  return `${prefix}: ${detail}`;
}

function belongsToHighCourtScope(
  record: Pick<RunRecord | PublicationRecord, "scopeType" | "scopeCode">,
  courtCode: string,
) {
  return record.scopeType === "high_court" && record.scopeCode === courtCode;
}
