import { basename } from "node:path";

import type { AppConfig } from "../config/env.js";
import { PublishedSnapshotSchema, type DistrictSnapshot, type PublishedSnapshot } from "../domain/snapshot-schema.js";
import { createId } from "../lib/ids.js";
import { freshnessDays } from "../lib/time.js";
import type { ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore, type PublicationRecord, type PublishedSnapshotRecord, type RunRecord } from "../storage/postgres.js";
import { sha256 } from "../lib/hash.js";

export class PublishedSnapshotService {
  constructor(
    private readonly config: AppConfig,
    private readonly store: PgWarehouseStore,
    private readonly artifactStore: ArtifactStore,
  ) {}

  async getPublishedSnapshot(): Promise<PublishedSnapshotRecord | null> {
    return this.store.getLatestPublishedSnapshot(this.config.STATE_CODE);
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

  async getTrends(): Promise<{ snapshot: PublishedSnapshot["snapshot"]; trends: PublishedSnapshot["trends"] } | null> {
    const record = await this.getPublishedSnapshot();
    return record ? { snapshot: record.payload.snapshot, trends: record.payload.trends } : null;
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns(this.config.STATE_CODE);
  }

  async listPublications(): Promise<PublicationRecord[]> {
    return this.store.listPublications(this.config.STATE_CODE);
  }

  async seedPublishedSnapshot(input: {
    publishedSnapshot: PublishedSnapshot;
    rawArtifact: unknown;
    note?: string;
  }): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: PublishedSnapshotRecord }> {
    await this.artifactStore.ensureBucket();

    const publishedAt = new Date().toISOString();
    const runId = createId("run");
    const payload = materializePayload(input.publishedSnapshot, publishedAt, runId);
    const artifactKey = [
      "raw",
      this.config.DEPLOY_ENV,
      this.config.STATE_CODE.toLowerCase(),
      payload.snapshot.sourceSnapshotAt.slice(0, 10),
      "dashboard.json",
    ].join("/");

    const artifact = await this.artifactStore.uploadJson(artifactKey, input.rawArtifact, {
      checksumsha256: sha256(JSON.stringify(input.rawArtifact)),
      source: "seed",
    });

    return this.store.withTransaction(async (tx) => {
      const run = await tx.insertRun({
        id: runId,
        stateCode: this.config.STATE_CODE,
        sourceLabel: payload.snapshot.sourceName,
        sourceSnapshotAt: payload.snapshot.sourceSnapshotAt,
        methodologyVersion: payload.snapshot.methodologyVersion,
        status: "published",
        qualityState: payload.snapshot.qualityState,
        note: input.note ?? "Seeded published snapshot from fixture-backed evidence input.",
      });

      await tx.insertArtifact({
        id: createId("artifact"),
        runId: run.id,
        artifactType: "raw-dashboard-json",
        s3Bucket: artifact.bucket,
        s3Key: artifact.key,
        checksumSha256: artifact.checksumSha256,
        sizeBytes: artifact.sizeBytes,
        metadata: { origin: "seed" },
      });

      const snapshot = await tx.insertPublishedSnapshot({
        id: createId("snapshot"),
        runId: run.id,
        stateCode: this.config.STATE_CODE,
        payloadVersion: 1,
        payload,
        checksumSha256: sha256(JSON.stringify(payload)),
      });

      const previousPublication = await tx.getLatestPublication(this.config.STATE_CODE);
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: this.config.STATE_CODE,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: input.note ?? "Initial publish",
        previousPublicationId: previousPublication?.id ?? null,
      });

      return { run, publication, snapshot };
    });
  }

  async replayRun(runId: string, note?: string): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: PublishedSnapshotRecord }> {
    const sourceRun = await this.store.getRunById(runId);
    if (!sourceRun) {
      throw new Error(`Run ${runId} was not found.`);
    }

    const sourceArtifacts = await this.store.listArtifactsForRun(runId);
    if (sourceArtifacts.length === 0) {
      throw new Error(`Run ${runId} does not have any replayable raw artifacts.`);
    }

    const sourceSnapshot = await this.store.getSnapshotForRun(runId);
    if (!sourceSnapshot) {
      throw new Error(`Run ${runId} does not have a published snapshot payload to replay.`);
    }

    await this.artifactStore.ensureBucket();

    return this.store.withTransaction(async (tx) => {
      const replayRunId = createId("run");
      const replayRun = await tx.insertRun({
        id: replayRunId,
        stateCode: sourceRun.stateCode,
        sourceLabel: sourceRun.sourceLabel,
        sourceSnapshotAt: sourceRun.sourceSnapshotAt,
        methodologyVersion: sourceRun.methodologyVersion,
        status: "replayed",
        qualityState: sourceRun.qualityState,
        replayOfRunId: sourceRun.id,
        note: note ?? `Replay of ${sourceRun.id}`,
      });

      for (const artifact of sourceArtifacts) {
        const copiedKey = [
          "raw",
          this.config.DEPLOY_ENV,
          this.config.STATE_CODE.toLowerCase(),
          "replays",
          replayRun.id,
          basename(artifact.s3Key),
        ].join("/");

        const copiedArtifact = await this.artifactStore.copyObject(artifact.s3Key, copiedKey, {
          checksumsha256: artifact.checksumSha256,
          replayofrunid: sourceRun.id,
        });

        await tx.insertArtifact({
          id: createId("artifact"),
          runId: replayRun.id,
          artifactType: artifact.artifactType,
          s3Bucket: copiedArtifact.bucket,
          s3Key: copiedArtifact.key,
          checksumSha256: copiedArtifact.checksumSha256 || artifact.checksumSha256,
          sizeBytes: copiedArtifact.sizeBytes || artifact.sizeBytes,
          metadata: {
            replayOfRunId: sourceRun.id,
            sourceArtifactId: artifact.id,
          },
        });
      }

      const publishedAt = new Date().toISOString();
      const replayPayload = materializePayload(sourceSnapshot.payload, publishedAt, replayRun.id, sourceRun.id);
      const snapshot = await tx.insertPublishedSnapshot({
        id: createId("snapshot"),
        runId: replayRun.id,
        stateCode: replayRun.stateCode,
        payloadVersion: sourceSnapshot.payloadVersion,
        payload: replayPayload,
        checksumSha256: sha256(JSON.stringify(replayPayload)),
      });

      const previousPublication = await tx.getLatestPublication(this.config.STATE_CODE);
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: this.config.STATE_CODE,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: note ?? `Replay publish of ${sourceRun.id}`,
        previousPublicationId: previousPublication?.id ?? null,
      });

      return { run: replayRun, publication, snapshot };
    });
  }

  async rollbackPublication(publicationId: string, note?: string): Promise<PublicationRecord> {
    const target = await this.store.getPublicationById(publicationId);
    if (!target) {
      throw new Error(`Publication ${publicationId} was not found.`);
    }

    const latest = await this.store.getLatestPublication(this.config.STATE_CODE);
    if (!latest) {
      throw new Error("Rollback requires an existing publication history.");
    }

    return this.store.insertPublication({
      id: createId("publication"),
      stateCode: this.config.STATE_CODE,
      publishedSnapshotId: target.publishedSnapshotId,
      action: "rollback",
      note: note ?? `Rollback to publication ${target.id}`,
      previousPublicationId: latest.id,
    });
  }

  async renderDistrictCsv(): Promise<string | null> {
    const result = await this.listDistricts();
    if (!result) {
      return null;
    }

    const header = "district_id,district_name,rank,backlog_cases,disposal_rate,median_age_days,filing_vs_disposal_gap,flag_reason";
    const rows = result.districts.map((district) =>
      [
        district.districtId,
        csvCell(district.districtName),
        district.rank,
        district.backlogCases,
        district.disposalRate,
        district.medianAgeDays,
        district.filingVsDisposalGap,
        csvCell(district.flagReason),
      ].join(","),
    );

    return [header, ...rows].join("\n");
  }
}

function materializePayload(
  payload: PublishedSnapshot,
  publishedAt: string,
  runId: string,
  replayedFromRunId?: string,
): PublishedSnapshot {
  const nextPayload = PublishedSnapshotSchema.parse({
    ...payload,
    snapshot: {
      ...payload.snapshot,
      publishedAt,
      publishedFromRunId: runId,
      replayedFromRunId,
      freshnessDays: freshnessDays(payload.snapshot.sourceSnapshotAt, new Date(publishedAt)),
    },
  });

  return nextPayload;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
