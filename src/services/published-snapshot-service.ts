import { basename } from "node:path";

import type { AppConfig } from "../config/env.js";
import { type NjdgCaptureBundle } from "../domain/njdg-capture-schema.js";
import {
  PublishedSnapshotSchema,
  type DistrictSnapshot,
  type PublishedSnapshot,
  type QualityState,
} from "../domain/snapshot-schema.js";
import { SnapshotCandidateSchema, type SnapshotCandidate } from "../domain/snapshot-candidate-schema.js";
import { extractCaptureBundle } from "../extract/njdg-html.js";
import type { NjdgSourceClient } from "../ingest/himachal-source-client.js";
import { createId } from "../lib/ids.js";
import { logError, logInfo } from "../lib/logger.js";
import { freshnessDays } from "../lib/time.js";
import { buildSnapshotCandidate } from "../normalize/snapshot-candidate.js";
import type { ArtifactStore } from "../storage/artifact-store.js";
import {
  PgWarehouseStore,
  type ArtifactRecord,
  type PublicationRecord,
  type PublishedSnapshotRecord,
  type RunRecord,
} from "../storage/postgres.js";
import { sha256 } from "../lib/hash.js";
import type { NjdgStateProfile } from "../geographies.js";
import { PublicCacheInvalidationService } from "./public-cache-invalidation.js";

const RAW_CAPTURE_ARTIFACT_TYPE = "raw-njdg-html-bundle";
const SNAPSHOT_CANDIDATE_ARTIFACT_TYPE = "snapshot-candidate-json";

export interface RunInspection {
  run: RunRecord;
  artifacts: ArtifactRecord[];
  candidate: SnapshotCandidate | null;
  publishedSnapshot: PublishedSnapshotRecord | null;
}

export interface SnapshotHistoryEntry {
  snapshot: PublishedSnapshot["snapshot"];
  stats: PublishedSnapshot["stats"];
}

export interface PublicationHistoryEntry {
  publication: PublicationRecord;
  snapshot: PublishedSnapshot["snapshot"] & { id: string };
  run: Pick<RunRecord, "id" | "status" | "replayOfRunId" | "sourceSnapshotAt" | "methodologyVersion" | "qualityState">;
  isActive: boolean;
}

export interface DistrictHistoryPoint {
  districtId: string;
  districtName: string;
  snapshotDate: string;
  publishedAt: string;
  methodologyVersion: string;
  qualityState: QualityState;
  freshnessDays: number;
  rank: number;
  backlogCases: number;
  disposalRate: number;
  medianAgeDays: number;
  filingVsDisposalGap: number;
  flagReason: string;
  summary: string;
}

export interface DistrictDetail {
  snapshot: PublishedSnapshot["snapshot"];
  district: DistrictSnapshot;
  history: DistrictHistoryPoint[];
}

export class PublishedSnapshotService {
  private readonly cacheInvalidation: PublicCacheInvalidationService;

  constructor(
    private readonly config: AppConfig,
    private readonly profile: NjdgStateProfile,
    private readonly store: PgWarehouseStore,
    private readonly artifactStore: ArtifactStore,
    private readonly sourceClient: NjdgSourceClient,
  ) {
    this.cacheInvalidation = new PublicCacheInvalidationService(config);
  }

  async getPublishedSnapshot(): Promise<PublishedSnapshotRecord | null> {
    return this.store.getLatestPublishedSnapshot(this.profile.stateCode);
  }

  async getStats(): Promise<{ snapshot: PublishedSnapshot["snapshot"]; stats: PublishedSnapshot["stats"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, stats: record.payload.stats } : null;
  }

  async listDistricts(): Promise<{ snapshot: PublishedSnapshot["snapshot"]; districts: DistrictSnapshot[] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, districts: record.payload.districts } : null;
  }

  async getDistrict(districtId: string): Promise<{ snapshot: PublishedSnapshot["snapshot"]; district: DistrictSnapshot } | null> {
    const record = await this.getPublishedSnapshot();
    if (!record) {
      return null;
    }

    const district = record.payload.districts.find((item) => item.districtId === districtId);
    return district ? { snapshot: record.payload.snapshot, district } : null;
  }

  async getDistrictDetail(districtId: string): Promise<DistrictDetail | null> {
    const record = await this.getPublishedSnapshot();
    if (!record) {
      return null;
    }

    const district = record.payload.districts.find((item) => item.districtId === districtId);
    if (!district) {
      return null;
    }

    const history = (await this.loadHistoricalSnapshots())
      .map((snapshot) => buildDistrictHistoryPoint(snapshot, districtId))
      .filter((point): point is DistrictHistoryPoint => point !== null);

    return {
      snapshot: record.payload.snapshot,
      district,
      history,
    };
  }

  async getTrends(): Promise<{ snapshot: PublishedSnapshot["snapshot"]; trends: PublishedSnapshot["trends"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, trends: record.payload.trends } : null;
  }

  async listSnapshotHistory(): Promise<SnapshotHistoryEntry[]> {
    return (await this.loadHistoricalSnapshots()).map((snapshot) => ({
      snapshot: snapshot.snapshot,
      stats: snapshot.stats,
    }));
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns(this.profile.stateCode);
  }

  async listPublications(): Promise<PublicationRecord[]> {
    return this.store.listPublications(this.profile.stateCode);
  }

  async listPublicationHistory(): Promise<PublicationHistoryEntry[]> {
    const publications = await this.store.listPublications(this.profile.stateCode);
    const entries = await Promise.all(
      publications.map(async (publication, index) => {
        const snapshot = await this.store.getPublishedSnapshotById(publication.publishedSnapshotId);
        if (!snapshot) {
          throw new Error(`Published snapshot ${publication.publishedSnapshotId} was not found.`);
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
          run: {
            id: run.id,
            status: run.status,
            replayOfRunId: run.replayOfRunId,
            sourceSnapshotAt: run.sourceSnapshotAt,
            methodologyVersion: run.methodologyVersion,
            qualityState: run.qualityState,
          },
          isActive: index === 0,
        } satisfies PublicationHistoryEntry;
      }),
    );

    return entries;
  }

  async inspectRun(runId: string): Promise<RunInspection | null> {
    const run = await this.store.getRunById(runId);
    if (!run || run.stateCode !== this.profile.stateCode) {
      return null;
    }

    const artifacts = await this.store.listArtifactsForRun(runId);
    const candidateArtifact = artifacts.find((artifact) => artifact.artifactType === SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);
    const candidate = candidateArtifact
      ? SnapshotCandidateSchema.parse(await this.artifactStore.downloadJson(candidateArtifact.s3Key))
      : null;

    return {
      run,
      artifacts,
      candidate,
      publishedSnapshot: await this.store.getSnapshotForRun(runId),
    };
  }

  async captureRun(note?: string): Promise<RunInspection> {
    await this.artifactStore.ensureBucket();
    logInfo("operator_fetch_started", {
      stateCode: this.profile.stateCode,
      note: note ?? null,
    });

    const bundle = await this.sourceClient.captureLatest();
    const extracted = extractCaptureBundle(bundle);
    const run = await this.store.insertRun({
      id: createId("run"),
      stateCode: this.profile.stateCode,
      sourceLabel: extracted.sourceName,
      sourceSnapshotAt: extracted.sourceSnapshotAt,
      methodologyVersion: "2026.04-alpha",
      status: "pending",
      qualityState: "partial",
      note: note ?? `Captured the latest NJDG ${this.profile.stateName} dashboard pages.`,
    });

    try {
      const rawArtifact = await this.artifactStore.uploadJson(
        buildRawArtifactKey(this.config.DEPLOY_ENV, this.profile.stateCode, run.id, extracted.sourceSnapshotAt),
        bundle,
        {
        source: "njdg",
        capturedat: bundle.capturedAt,
        districtcount: String(bundle.districtPages.length),
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
          source: "njdg",
          capturedAt: bundle.capturedAt,
          districtCount: bundle.districtPages.length,
        },
      });

      await this.buildAndStoreSnapshotCandidate(run.id, rawArtifact.key, note);
      const inspection = await this.inspectRun(run.id);
      if (!inspection) {
        throw new Error(`Run ${run.id} was not found after capture.`);
      }

      logInfo("operator_fetch_completed", {
        runId: run.id,
        sourceSnapshotAt: extracted.sourceSnapshotAt,
        qualityState: inspection.run.qualityState,
        artifactCount: inspection.artifacts.length,
      });

      return inspection;
    } catch (error) {
      logError("operator_fetch_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(run.id, {
        status: "failed",
        note: buildFailureNote("Capture failed", error),
      });
      throw error;
    }
  }

  async publishRun(runId: string, note?: string): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: PublishedSnapshotRecord }> {
    logInfo("operator_publish_started", {
      runId,
      note: note ?? null,
    });
    const inspection = await this.inspectRun(runId);
    if (!inspection) {
      throw new Error(`Run ${runId} was not found.`);
    }

    assertPublishableRun(inspection);
    const payload = materializePayload(
      inspection.candidate,
      new Date().toISOString(),
      runId,
      inspection.run.replayOfRunId ?? undefined,
    );

    const result = await this.store.withTransaction(async (tx) => {
      const snapshot = await tx.insertPublishedSnapshot({
        id: createId("snapshot"),
        runId,
        stateCode: this.profile.stateCode,
        payloadVersion: 1,
        payload,
        checksumSha256: sha256(JSON.stringify(payload)),
      });

      const previousPublication = await tx.getLatestPublication(this.profile.stateCode);
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: this.profile.stateCode,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: note ?? defaultPublishNote(inspection.run),
        previousPublicationId: previousPublication?.id ?? null,
      });

      const run = await tx.updateRun(runId, {
        status: inspection.run.replayOfRunId ? "replayed" : "published",
        qualityState: inspection.run.qualityState,
      });

      logInfo("operator_publish_completed", {
        runId,
        publicationId: publication.id,
        snapshotId: snapshot.id,
        action: publication.action,
        replayOfRunId: inspection.run.replayOfRunId ?? null,
      });

      return { run, publication, snapshot };
    });

    await this.cacheInvalidation.invalidatePublishedData(
      this.profile.stateCode,
      result.snapshot.payload.districts.map((district) => district.districtId),
    );

    return result;
  }

  async replayRun(runId: string, note?: string): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: PublishedSnapshotRecord }> {
    logInfo("operator_replay_started", {
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
        buildReplayRawArtifactKey(this.config.DEPLOY_ENV, this.profile.stateCode, replayRun.id, rawArtifact.s3Key),
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
      const replayResult = await this.publishRun(replayRun.id, note ?? `Replay publish of ${sourceInspection.run.id}`);
      logInfo("operator_replay_completed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        publicationId: replayResult.publication.id,
        snapshotId: replayResult.snapshot.id,
      });
      return replayResult;
    } catch (error) {
      logError("operator_replay_failed", {
        sourceRunId: sourceInspection.run.id,
        replayRunId: replayRun.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(replayRun.id, {
        status: "failed",
        note: buildFailureNote("Replay failed", error),
      });
      throw error;
    }
  }

  async rollbackPublication(publicationId: string, note?: string): Promise<PublicationRecord> {
    logInfo("operator_rollback_started", {
      targetPublicationId: publicationId,
      note: note ?? null,
    });
    const target = await this.store.getPublicationById(publicationId);
    if (!target) {
      throw new Error(`Publication ${publicationId} was not found.`);
    }
    if (target.stateCode !== this.profile.stateCode) {
      throw new Error(`Publication ${publicationId} does not belong to ${this.profile.stateCode}.`);
    }

    const latest = await this.store.getLatestPublication(this.profile.stateCode);
    if (!latest) {
      throw new Error("Rollback requires an existing publication history.");
    }

    const targetSnapshot = await this.store.getPublishedSnapshotById(target.publishedSnapshotId);
    if (!targetSnapshot) {
      throw new Error(`Published snapshot ${target.publishedSnapshotId} was not found.`);
    }

    const rollback = await this.store.insertPublication({
      id: createId("publication"),
      stateCode: this.profile.stateCode,
      publishedSnapshotId: target.publishedSnapshotId,
      action: "rollback",
      note: note ?? `Rollback to publication ${target.id}`,
      previousPublicationId: latest.id,
    });

    logInfo("operator_rollback_completed", {
      targetPublicationId: publicationId,
      rollbackPublicationId: rollback.id,
      restoredSnapshotId: rollback.publishedSnapshotId,
      previousPublicationId: rollback.previousPublicationId,
    });

    await this.cacheInvalidation.invalidatePublishedData(
      this.profile.stateCode,
      targetSnapshot.payload.districts.map((district) => district.districtId),
    );

    return rollback;
  }

  async renderDistrictCsv(): Promise<string | null> {
    const record = await this.getPublishedSnapshot();
    if (!record) {
      return null;
    }

    const { snapshot, districts } = record.payload;
    const header = [
      "snapshot_date",
      "published_at",
      "methodology_version",
      "quality_state",
      "freshness_days",
      "state_code",
      "source_name",
      "source_attribution",
      "district_id",
      "district_name",
      "rank",
      "backlog_cases",
      "disposal_rate",
      "median_age_days",
      "filing_vs_disposal_gap",
      "flag_reason",
      "summary",
    ].join(",");
    const rows = districts.map((district) =>
      [
        snapshot.sourceSnapshotAt,
        snapshot.publishedAt,
        csvCell(snapshot.methodologyVersion),
        snapshot.qualityState,
        snapshot.freshnessDays,
        snapshot.stateCode,
        csvCell(snapshot.sourceName),
        csvCell(snapshot.sourceAttribution),
        district.districtId,
        csvCell(district.districtName),
        district.rank,
        district.backlogCases,
        district.disposalRate,
        district.medianAgeDays,
        district.filingVsDisposalGap,
        csvCell(district.flagReason),
        csvCell(district.summary),
      ].join(","),
    );

    return [header, ...rows].join("\n");
  }

  async renderDistrictHistoryCsv(districtId: string): Promise<string | null> {
    const detail = await this.getDistrictDetail(districtId);
    if (!detail) {
      return null;
    }

    const header = [
      "snapshot_date",
      "published_at",
      "methodology_version",
      "quality_state",
      "freshness_days",
      "district_id",
      "district_name",
      "rank",
      "backlog_cases",
      "disposal_rate",
      "median_age_days",
      "filing_vs_disposal_gap",
      "flag_reason",
      "summary",
    ].join(",");
    const rows = detail.history.map((point) =>
      [
        point.snapshotDate,
        point.publishedAt,
        csvCell(point.methodologyVersion),
        point.qualityState,
        point.freshnessDays,
        point.districtId,
        csvCell(point.districtName),
        point.rank,
        point.backlogCases,
        point.disposalRate,
        point.medianAgeDays,
        point.filingVsDisposalGap,
        csvCell(point.flagReason),
        csvCell(point.summary),
      ].join(","),
    );

    return [header, ...rows].join("\n");
  }

  private async buildAndStoreSnapshotCandidate(runId: string, rawArtifactKey: string, note?: string): Promise<SnapshotCandidate> {
    const bundle = await this.artifactStore.downloadJson<NjdgCaptureBundle>(rawArtifactKey);
    const previousSnapshots = await this.loadHistoricalSnapshots();
    const candidate = buildSnapshotCandidate(extractCaptureBundle(bundle), previousSnapshots);

    const storedCandidate = await this.artifactStore.uploadJson(
      buildCandidateArtifactKey(this.config.DEPLOY_ENV, this.profile.stateCode, runId, candidate.snapshot.sourceSnapshotAt),
      candidate,
      {
        source: "normalized",
        methodologyversion: candidate.snapshot.methodologyVersion,
        sourcesnapshotat: candidate.snapshot.sourceSnapshotAt,
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

  private async loadHistoricalSnapshots(): Promise<PublishedSnapshot[]> {
    const publications = await this.store.listPublications(this.profile.stateCode);
    const snapshots: PublishedSnapshot[] = [];
    const seenSnapshotIds = new Set<string>();

    for (const publication of publications) {
      if (seenSnapshotIds.has(publication.publishedSnapshotId)) {
        continue;
      }

      seenSnapshotIds.add(publication.publishedSnapshotId);
      const snapshot = await this.store.getPublishedSnapshotById(publication.publishedSnapshotId);
      if (snapshot) {
        snapshots.push(snapshot.payload);
      }
    }

    return snapshots.sort((left, right) => {
      return (
        left.snapshot.sourceSnapshotAt.localeCompare(right.snapshot.sourceSnapshotAt) ||
        left.snapshot.publishedAt.localeCompare(right.snapshot.publishedAt)
      );
    });
  }
}

function materializePayload(
  candidate: SnapshotCandidate,
  publishedAt: string,
  runId: string,
  replayedFromRunId?: string,
): PublishedSnapshot {
  const nextPayload = PublishedSnapshotSchema.parse({
    ...candidate,
    snapshot: {
      ...candidate.snapshot,
      publishedAt,
      publishedFromRunId: runId,
      replayedFromRunId,
      freshnessDays: freshnessDays(candidate.snapshot.sourceSnapshotAt, new Date(publishedAt)),
    },
  });

  return nextPayload;
}

function assertPublishableRun(inspection: RunInspection): asserts inspection is RunInspection & { candidate: SnapshotCandidate } {
  if (inspection.run.status !== "completed") {
    throw new Error(`Run ${inspection.run.id} is not ready to publish. Current status: ${inspection.run.status}.`);
  }

  if (inspection.run.qualityState === "partial") {
    throw new Error(`Run ${inspection.run.id} is incomplete and cannot be published.`);
  }

  requireArtifact(inspection.artifacts, RAW_CAPTURE_ARTIFACT_TYPE);
  requireArtifact(inspection.artifacts, SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);

  if (!inspection.candidate) {
    throw new Error(`Run ${inspection.run.id} does not have a valid snapshot candidate.`);
  }
}

function requireArtifact(artifacts: ArtifactRecord[], artifactType: string): ArtifactRecord {
  const artifact = artifacts.find((item) => item.artifactType === artifactType);
  if (!artifact) {
    throw new Error(`Run is missing required artifact: ${artifactType}.`);
  }

  return artifact;
}

function buildRawArtifactKey(deployEnv: AppConfig["DEPLOY_ENV"], stateCode: string, runId: string, sourceSnapshotAt: string): string {
  return [
    "raw",
    deployEnv,
    stateCode.toLowerCase(),
    sourceSnapshotAt.slice(0, 10),
    `${runId}-njdg-dashboard-html.json`,
  ].join("/");
}

function buildCandidateArtifactKey(
  deployEnv: AppConfig["DEPLOY_ENV"],
  stateCode: string,
  runId: string,
  sourceSnapshotAt: string,
): string {
  return [
    "normalize",
    deployEnv,
    stateCode.toLowerCase(),
    sourceSnapshotAt.slice(0, 10),
    `${runId}-snapshot-candidate.json`,
  ].join("/");
}

function buildReplayRawArtifactKey(
  deployEnv: AppConfig["DEPLOY_ENV"],
  stateCode: string,
  runId: string,
  sourceKey: string,
): string {
  return ["raw", deployEnv, stateCode.toLowerCase(), "replays", runId, basename(sourceKey)].join("/");
}

function defaultPublishNote(run: RunRecord): string {
  return run.replayOfRunId ? `Replay publish of ${run.replayOfRunId}` : `Published completed run ${run.id}`;
}

function buildFailureNote(prefix: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : "Unexpected error";
  return `${prefix}: ${detail}`;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildDistrictHistoryPoint(snapshot: PublishedSnapshot, districtId: string): DistrictHistoryPoint | null {
  const district = snapshot.districts.find((item) => item.districtId === districtId);
  if (!district) {
    return null;
  }

  return {
    districtId: district.districtId,
    districtName: district.districtName,
    snapshotDate: snapshot.snapshot.sourceSnapshotAt,
    publishedAt: snapshot.snapshot.publishedAt,
    methodologyVersion: snapshot.snapshot.methodologyVersion,
    qualityState: snapshot.snapshot.qualityState,
    freshnessDays: snapshot.snapshot.freshnessDays,
    rank: district.rank,
    backlogCases: district.backlogCases,
    disposalRate: district.disposalRate,
    medianAgeDays: district.medianAgeDays,
    filingVsDisposalGap: district.filingVsDisposalGap,
    flagReason: district.flagReason,
    summary: district.summary,
  };
}
