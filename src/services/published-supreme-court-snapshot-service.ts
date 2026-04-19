import { basename } from "node:path";

import type { AppConfig } from "../config/env.js";
import type { SupremeCourtSnapshotCandidate } from "../domain/supreme-court-snapshot-candidate-schema.js";
import type { SupremeCourtCaptureBundle } from "../domain/supreme-court-capture-schema.js";
import type { SupremeCourtPublishedSnapshot } from "../domain/supreme-court-snapshot-schema.js";
import { SupremeCourtSnapshotCandidateSchema } from "../domain/supreme-court-snapshot-candidate-schema.js";
import { extractSupremeCourtCaptureBundle } from "../extract/supreme-court-njdg-html.js";
import type { SupremeCourtProfile } from "../supreme-court.js";
import type { SupremeCourtSourceClient } from "../ingest/supreme-court-source-client.js";
import { sha256 } from "../lib/hash.js";
import { createId } from "../lib/ids.js";
import { logError, logInfo } from "../lib/logger.js";
import {
  buildSupremeCourtSnapshotCandidate,
  materializeSupremeCourtPublishedSnapshot,
} from "../normalize/supreme-court-snapshot-candidate.js";
import { PublicCacheInvalidationService } from "./public-cache-invalidation.js";
import type { ArtifactStore } from "../storage/artifact-store.js";
import {
  PgWarehouseStore,
  type ArtifactRecord,
  type PublicationRecord,
  type RunRecord,
  type SupremeCourtPublishedSnapshotRecord,
} from "../storage/postgres.js";

const RAW_CAPTURE_ARTIFACT_TYPE = "raw-supreme-court-html-bundle";
const SNAPSHOT_CANDIDATE_ARTIFACT_TYPE = "supreme-court-snapshot-candidate-json";

export interface SupremeCourtRunInspection {
  run: RunRecord;
  artifacts: ArtifactRecord[];
  candidate: SupremeCourtSnapshotCandidate | null;
  publishedSnapshot: SupremeCourtPublishedSnapshotRecord | null;
}

export interface SupremeCourtPublicationHistoryEntry {
  publication: PublicationRecord;
  snapshot: SupremeCourtPublishedSnapshot["snapshot"] & { id: string };
  stats: Pick<SupremeCourtPublishedSnapshot["stats"], "pendingTotalCases" | "disposedLastMonthTotalCases">;
  run: Pick<RunRecord, "id" | "status" | "replayOfRunId" | "sourceSnapshotAt" | "methodologyVersion" | "qualityState">;
  isActive: boolean;
}

export class PublishedSupremeCourtSnapshotService {
  private readonly cacheInvalidation: PublicCacheInvalidationService;

  constructor(
    private readonly config: AppConfig,
    private readonly profile: SupremeCourtProfile,
    private readonly store: PgWarehouseStore,
    private readonly artifactStore: ArtifactStore,
    private readonly sourceClient: SupremeCourtSourceClient,
  ) {
    this.cacheInvalidation = new PublicCacheInvalidationService(config);
  }

  async getPublishedSnapshot(): Promise<SupremeCourtPublishedSnapshotRecord | null> {
    return this.store.getLatestSupremeCourtPublishedSnapshot(this.profile.courtCode);
  }

  async getStats(): Promise<{ snapshot: SupremeCourtPublishedSnapshot["snapshot"]; stats: SupremeCourtPublishedSnapshot["stats"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, stats: record.payload.stats } : null;
  }

  async getTrends(): Promise<{ snapshot: SupremeCourtPublishedSnapshot["snapshot"]; trends: SupremeCourtPublishedSnapshot["trends"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, trends: record.payload.trends } : null;
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns(this.profile.courtCode);
  }

  async listPublications(): Promise<PublicationRecord[]> {
    return this.store.listPublications(this.profile.courtCode);
  }

  async listPublicationHistory(): Promise<SupremeCourtPublicationHistoryEntry[]> {
    const publications = await this.store.listPublications(this.profile.courtCode);
    const entries = await Promise.all(
      publications.map(async (publication, index) => {
        const snapshot = await this.store.getSupremeCourtPublishedSnapshotById(publication.publishedSnapshotId);
        if (!snapshot) {
          throw new Error(`Supreme Court published snapshot ${publication.publishedSnapshotId} was not found.`);
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
        } satisfies SupremeCourtPublicationHistoryEntry;
      }),
    );

    return entries;
  }

  async inspectRun(runId: string): Promise<SupremeCourtRunInspection | null> {
    const run = await this.store.getRunById(runId);
    if (!run || run.stateCode !== this.profile.courtCode) {
      return null;
    }

    const artifacts = await this.store.listArtifactsForRun(runId);
    const candidateArtifact = artifacts.find((artifact) => artifact.artifactType === SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);
    const candidate = candidateArtifact
      ? SupremeCourtSnapshotCandidateSchema.parse(await this.artifactStore.downloadJson(candidateArtifact.s3Key))
      : null;

    return {
      run,
      artifacts,
      candidate,
      publishedSnapshot: await this.store.getSupremeCourtSnapshotForRun(runId),
    };
  }

  async captureRun(note?: string): Promise<SupremeCourtRunInspection> {
    await this.artifactStore.ensureBucket();
    logInfo("supreme_court_operator_fetch_started", { note: note ?? null });

    const bundle = await this.sourceClient.captureLatest();
    const extracted = extractSupremeCourtCaptureBundle(bundle);
    const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
    const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";
    const run = await this.store.insertRun({
      id: createId("run"),
      stateCode: this.profile.courtCode,
      sourceLabel: extracted.sourceName,
      sourceSnapshotAt: referenceDateAt,
      methodologyVersion: "2026.04-supreme-court-draft",
      status: "pending",
      qualityState: "partial",
      note: note ?? "Captured the latest Supreme Court NJDG dashboard page.",
    });

    try {
      const rawArtifact = await this.artifactStore.uploadJson(
        buildRawArtifactKey(this.config.DEPLOY_ENV, this.profile.courtCode, run.id, referenceDateAt),
        bundle,
        {
          source: "sc-njdg",
          capturedat: bundle.capturedAt,
          referencedateat: referenceDateAt,
          referencedatekind: referenceDateKind,
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
          source: "sc-njdg",
          capturedAt: bundle.capturedAt,
          referenceDateAt,
          referenceDateKind,
          sourceSnapshotAt: extracted.sourceSnapshotAt,
        },
      });

      await this.buildAndStoreSnapshotCandidate(run.id, rawArtifact.key, note);
      const inspection = await this.inspectRun(run.id);
      if (!inspection) {
        throw new Error(`Run ${run.id} was not found after Supreme Court capture.`);
      }

      logInfo("supreme_court_operator_fetch_completed", {
        runId: run.id,
        referenceDateAt,
        referenceDateKind,
        qualityState: inspection.run.qualityState,
        artifactCount: inspection.artifacts.length,
      });

      return inspection;
    } catch (error) {
      logError("supreme_court_operator_fetch_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(run.id, {
        status: "failed",
        note: buildFailureNote("Supreme Court capture failed", error),
      });
      throw error;
    }
  }

  async publishRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: SupremeCourtPublishedSnapshotRecord }> {
    logInfo("supreme_court_operator_publish_started", { runId, note: note ?? null });
    const inspection = await this.inspectRun(runId);
    if (!inspection) {
      throw new Error(`Run ${runId} was not found.`);
    }

    assertPublishableRun(inspection);
    const payload = materializeSupremeCourtPublishedSnapshot(
      inspection.candidate,
      new Date().toISOString(),
      runId,
      inspection.run.replayOfRunId ?? undefined,
    );

    const result = await this.store.withTransaction(async (tx) => {
      const snapshot = await tx.insertSupremeCourtPublishedSnapshot({
        id: createId("snapshot"),
        runId,
        stateCode: this.profile.courtCode,
        payloadVersion: 1,
        payload,
        checksumSha256: sha256(JSON.stringify(payload)),
      });

      const previousPublication = await tx.getLatestPublication(this.profile.courtCode);
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: this.profile.courtCode,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: note ?? defaultPublishNote(inspection.run),
        previousPublicationId: previousPublication?.id ?? null,
      });

      const run = await tx.updateRun(runId, {
        status: inspection.run.replayOfRunId ? "replayed" : "published",
        qualityState: inspection.run.qualityState,
      });

      logInfo("supreme_court_operator_publish_completed", {
        runId,
        publicationId: publication.id,
        snapshotId: snapshot.id,
      });

      return { run, publication, snapshot };
    });

    await this.cacheInvalidation.invalidateSupremeCourtRoutes();

    return result;
  }

  async replayRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: SupremeCourtPublishedSnapshotRecord }> {
    logInfo("supreme_court_operator_replay_started", {
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
      stateCode: this.profile.courtCode,
      sourceLabel: sourceInspection.run.sourceLabel,
      sourceSnapshotAt: sourceInspection.run.sourceSnapshotAt,
      methodologyVersion: sourceInspection.run.methodologyVersion,
      status: "pending",
      qualityState: sourceInspection.run.qualityState,
      replayOfRunId: runId,
      note: note ?? `Replay of Supreme Court run ${runId}.`,
    });

    if (!sourceInspection.candidate) {
      throw new Error(`Run ${runId} does not have a Supreme Court snapshot candidate.`);
    }

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

      await this.buildAndStoreSnapshotCandidate(replayRun.id, copiedArtifact.key, note);
      const replayResult = await this.publishRun(replayRun.id, note ?? `Replayed publication from ${runId}.`);
      logInfo("supreme_court_operator_replay_completed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        publicationId: replayResult.publication.id,
        snapshotId: replayResult.snapshot.id,
      });
      return replayResult;
    } catch (error) {
      logError("supreme_court_operator_replay_failed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(replayRun.id, {
        status: "failed",
        note: buildFailureNote("Supreme Court replay failed", error),
      });
      throw error;
    }
  }

  async rollbackPublication(publicationId: string, note?: string): Promise<PublicationRecord> {
    logInfo("supreme_court_operator_rollback_started", {
      targetPublicationId: publicationId,
      note: note ?? null,
    });
    const target = await this.store.getPublicationById(publicationId);
    if (!target || target.stateCode !== this.profile.courtCode) {
      throw new Error(`Publication ${publicationId} was not found.`);
    }

    const latest = await this.store.getLatestPublication(this.profile.courtCode);
    if (!latest) {
      throw new Error("Rollback requires an existing publication history.");
    }

    const targetSnapshot = await this.store.getSupremeCourtPublishedSnapshotById(target.publishedSnapshotId);
    if (!targetSnapshot) {
      throw new Error(`Supreme Court published snapshot ${target.publishedSnapshotId} was not found.`);
    }

    const rollback = await this.store.insertPublication({
      id: createId("publication"),
      stateCode: this.profile.courtCode,
      publishedSnapshotId: targetSnapshot.id,
      action: "rollback",
      note: note ?? `Rollback to publication ${target.id}`,
      previousPublicationId: latest.id,
    });

    logInfo("supreme_court_operator_rollback_completed", {
      targetPublicationId: publicationId,
      rollbackPublicationId: rollback.id,
      restoredSnapshotId: rollback.publishedSnapshotId,
      previousPublicationId: rollback.previousPublicationId,
    });

    await this.cacheInvalidation.invalidateSupremeCourtRoutes();

    return rollback;
  }

  private async buildAndStoreSnapshotCandidate(runId: string, rawArtifactKey: string, note?: string) {
    const bundle = await this.artifactStore.downloadJson<SupremeCourtCaptureBundle>(rawArtifactKey);
    const previousSnapshots = await this.loadHistoricalSnapshots();
    const candidate = buildSupremeCourtSnapshotCandidate(extractSupremeCourtCaptureBundle(bundle), previousSnapshots);

    await this.persistSnapshotCandidate(runId, candidate, note);
    await this.store.updateRun(runId, {
      status: "completed",
      qualityState: candidate.snapshot.qualityState,
      note,
    });
  }

  private async persistSnapshotCandidate(runId: string, candidate: SupremeCourtSnapshotCandidate, _note?: string) {
    const candidateArtifact = await this.artifactStore.uploadJson(
      buildCandidateArtifactKey(this.config.DEPLOY_ENV, this.profile.courtCode, runId, candidate.snapshot.referenceDateAt),
      candidate,
      {
        courttier: candidate.snapshot.courtTier,
        referencekind: candidate.snapshot.referenceDateKind,
        pendingtotalcases: String(candidate.stats.pendingTotalCases),
      },
    );

    await this.store.insertArtifact({
      id: createId("artifact"),
      runId,
      artifactType: SNAPSHOT_CANDIDATE_ARTIFACT_TYPE,
      s3Bucket: candidateArtifact.bucket,
      s3Key: candidateArtifact.key,
      checksumSha256: candidateArtifact.checksumSha256,
      sizeBytes: candidateArtifact.sizeBytes,
      metadata: {
        courtTier: candidate.snapshot.courtTier,
        referenceDateAt: candidate.snapshot.referenceDateAt,
        referenceDateKind: candidate.snapshot.referenceDateKind,
        sourceSnapshotAt: candidate.snapshot.sourceSnapshotAt,
      },
    });
  }

  private async loadHistoricalSnapshots(): Promise<SupremeCourtPublishedSnapshot[]> {
    const publications = await this.store.listPublications(this.profile.courtCode);
    const snapshots: SupremeCourtPublishedSnapshot[] = [];
    const seenSnapshotIds = new Set<string>();

    for (const publication of publications) {
      if (seenSnapshotIds.has(publication.publishedSnapshotId)) {
        continue;
      }

      seenSnapshotIds.add(publication.publishedSnapshotId);
      const snapshot = await this.store.getSupremeCourtPublishedSnapshotById(publication.publishedSnapshotId);
      if (snapshot) {
        snapshots.push(snapshot.payload);
      }
    }

    return snapshots.sort((left, right) => {
      return (
        left.snapshot.referenceDateAt.localeCompare(right.snapshot.referenceDateAt) ||
        left.snapshot.publishedAt.localeCompare(right.snapshot.publishedAt)
      );
    });
  }
}

function assertPublishableRun(inspection: SupremeCourtRunInspection): asserts inspection is SupremeCourtRunInspection & {
  candidate: SupremeCourtSnapshotCandidate;
} {
  if (inspection.run.status !== "completed") {
    throw new Error(`Run ${inspection.run.id} is not ready to publish. Current status: ${inspection.run.status}.`);
  }

  if (inspection.run.qualityState === "partial") {
    throw new Error(`Run ${inspection.run.id} is incomplete and cannot be published.`);
  }

  requireArtifact(inspection.artifacts, RAW_CAPTURE_ARTIFACT_TYPE);
  requireArtifact(inspection.artifacts, SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);

  if (!inspection.candidate) {
    throw new Error(`Run ${inspection.run.id} does not have a valid Supreme Court snapshot candidate.`);
  }
}

function requireArtifact(artifacts: ArtifactRecord[], artifactType: string): ArtifactRecord {
  const artifact = artifacts.find((item) => item.artifactType === artifactType);
  if (!artifact) {
    throw new Error(`Run is missing required artifact: ${artifactType}.`);
  }

  return artifact;
}

function buildRawArtifactKey(deployEnv: string, courtCode: string, runId: string, referenceDateAt: string) {
  return `${deployEnv}/supreme-courts/${courtCode}/runs/${runId}/${basename(referenceDateAt)}-raw.json`;
}

function buildReplayRawArtifactKey(deployEnv: string, courtCode: string, runId: string, sourceKey: string) {
  return `${deployEnv}/supreme-courts/${courtCode}/runs/${runId}/replay-${basename(sourceKey)}`;
}

function buildCandidateArtifactKey(deployEnv: string, courtCode: string, runId: string, referenceDateAt: string) {
  return `${deployEnv}/supreme-courts/${courtCode}/runs/${runId}/${basename(referenceDateAt)}-candidate.json`;
}

function buildFailureNote(prefix: string, error: unknown) {
  if (error instanceof Error) {
    return `${prefix}: ${error.message}`;
  }

  return `${prefix}: ${String(error)}`;
}

function defaultPublishNote(run: RunRecord) {
  return run.replayOfRunId
    ? `Published replayed Supreme Court snapshot from run ${run.replayOfRunId}.`
    : `Published Supreme Court snapshot from run ${run.id}.`;
}
