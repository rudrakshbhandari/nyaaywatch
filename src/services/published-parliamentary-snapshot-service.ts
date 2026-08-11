import type { AppConfig } from "../config/env.js";
import {
  ParliamentaryCaptureBundleSchema,
  ParliamentaryPublishedSnapshotSchema,
  ParliamentarySnapshotCandidateSchema,
  type ParliamentaryCaptureBundle,
  type ParliamentaryPublishedSnapshot,
} from "../domain/parliamentary-schema.js";
import { extractParliamentaryCapture } from "../extract/parliamentary-source.js";
import type { ParliamentarySourceClient } from "../ingest/parliamentary-source-client.js";
import { createId } from "../lib/ids.js";
import { sha256 } from "../lib/hash.js";
import { logError, logInfo } from "../lib/logger.js";
import { buildParliamentarySnapshotCandidate } from "../normalize/parliamentary-snapshot.js";
import type { ArtifactStore } from "../storage/artifact-store.js";
import {
  PgWarehouseStore,
  type ArtifactRecord,
  type ParliamentaryPublishedSnapshotRecord,
  type PublicationRecord,
  type RunRecord,
} from "../storage/postgres.js";

const SCOPE_TYPE = "parliamentary" as const;
const STATE_CODE = "PARLIAMENT";
const RAW_CAPTURE_ARTIFACT_TYPE = "parliamentary-capture-fixture-json";
const SNAPSHOT_CANDIDATE_ARTIFACT_TYPE = "parliamentary-snapshot-candidate-json";

export interface ParliamentaryRunInspection {
  run: RunRecord;
  artifacts: ArtifactRecord[];
  candidate: ReturnType<typeof ParliamentarySnapshotCandidateSchema.parse> | null;
  publishedSnapshot: ParliamentaryPublishedSnapshotRecord | null;
}

export interface ParliamentaryPublicationHistoryEntry {
  publication: PublicationRecord;
  snapshot: ParliamentaryPublishedSnapshotRecord;
  run: Pick<RunRecord, "id" | "status" | "replayOfRunId" | "sourceSnapshotAt" | "methodologyVersion" | "qualityState">;
  isActive: boolean;
}

export class PublishedParliamentarySnapshotService {
  constructor(
    private readonly config: AppConfig,
    private readonly store: PgWarehouseStore,
    private readonly artifactStore: ArtifactStore,
    private readonly sourceClient: ParliamentarySourceClient,
  ) {}

  async getPublishedSnapshot(): Promise<ParliamentaryPublishedSnapshotRecord | null> {
    return this.store.getLatestParliamentaryPublishedSnapshot("ls-18-session-5");
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns("ls-18-session-5", SCOPE_TYPE);
  }

  async listPublications(): Promise<PublicationRecord[]> {
    return this.store.listPublications("ls-18-session-5", SCOPE_TYPE);
  }

  async inspectRun(runId: string): Promise<ParliamentaryRunInspection | null> {
    const run = await this.store.getRunById(runId);
    if (!run || run.scopeType !== SCOPE_TYPE || run.scopeCode !== "ls-18-session-5") {
      return null;
    }

    const artifacts = await this.store.listArtifactsForRun(runId);
    const candidateArtifact = artifacts.find((artifact) => artifact.artifactType === SNAPSHOT_CANDIDATE_ARTIFACT_TYPE);
    const candidate = candidateArtifact
      ? ParliamentarySnapshotCandidateSchema.parse(
          await this.artifactStore.downloadJson(candidateArtifact.s3Key, {
            expectedChecksumSha256: candidateArtifact.checksumSha256,
          }),
        )
      : null;

    return {
      run,
      artifacts,
      candidate,
      publishedSnapshot: await this.store.getParliamentarySnapshotForRun(runId),
    };
  }

  async captureRun(note?: string): Promise<ParliamentaryRunInspection> {
    await this.artifactStore.ensureBucket();
    logInfo("parliamentary_operator_fetch_started", { note: note ?? null });

    const bundle = ParliamentaryCaptureBundleSchema.parse(await this.sourceClient.capture());
    const candidate = buildParliamentarySnapshotCandidate(bundle);
    const run = await this.store.insertRun({
      id: createId("run"),
      stateCode: STATE_CODE,
      scopeType: SCOPE_TYPE,
      scopeCode: candidate.metadata.scopeId,
      sourceLabel: "Digital Sansad Lok Sabha 18 Session 5 captured fixture",
      sourceSnapshotAt: candidate.metadata.referenceDateAt,
      methodologyVersion: candidate.metadata.methodologyVersion,
      status: "pending",
      qualityState: toRunQualityState(candidate.metadata.qualityState),
      note: note ?? "Captured the bounded internal Lok Sabha parliamentary fixture.",
    });

    try {
      await this.storeCaptureArtifacts(run.id, bundle, candidate);
      await this.store.updateRun(run.id, {
        status: "completed",
        qualityState: toRunQualityState(candidate.metadata.qualityState),
      });
      const inspection = await this.inspectRun(run.id);
      if (!inspection) {
        throw new Error(`Parliamentary run ${run.id} was not found after capture.`);
      }
      logInfo("parliamentary_operator_fetch_completed", {
        runId: run.id,
        scopeId: candidate.metadata.scopeId,
        qualityState: inspection.run.qualityState,
      });
      return inspection;
    } catch (error) {
      logError("parliamentary_operator_fetch_failed", {
        runId: run.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.store.updateRun(run.id, {
        status: "failed",
        note: buildFailureNote("Parliamentary capture failed", error),
      });
      throw error;
    }
  }

  async publishRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: ParliamentaryPublishedSnapshotRecord }> {
    const inspection = await this.inspectRun(runId);
    if (!inspection) {
      throw new Error(`Parliamentary run ${runId} was not found.`);
    }
    assertPublishableRun(inspection);

    const payload = ParliamentaryPublishedSnapshotSchema.parse({
      ...inspection.candidate,
      publishedAt: new Date().toISOString(),
      publishedFromRunId: runId,
    });

    const result = await this.store.withTransaction(async (tx) => {
      const snapshot = await tx.insertParliamentaryPublishedSnapshot({
        id: createId("snapshot"),
        runId,
        stateCode: STATE_CODE,
        scopeType: SCOPE_TYPE,
        scopeCode: payload.metadata.scopeId,
        payloadVersion: 1,
        payload,
        checksumSha256: sha256(JSON.stringify(payload)),
      });
      const previousPublication = await tx.getLatestPublication(payload.metadata.scopeId, SCOPE_TYPE);
      const publication = await tx.insertPublication({
        id: createId("publication"),
        stateCode: STATE_CODE,
        scopeType: SCOPE_TYPE,
        scopeCode: payload.metadata.scopeId,
        publishedSnapshotId: snapshot.id,
        action: "publish",
        note: note ?? `Published internal Lok Sabha ${payload.metadata.lokSabhaNumber} Session ${payload.metadata.sessionNumber} snapshot.`,
        previousPublicationId: previousPublication?.id ?? null,
      });
      const run = await tx.updateRun(runId, {
        status: inspection.run.replayOfRunId ? "replayed" : "published",
        qualityState: inspection.run.qualityState,
      });
      return { run, publication, snapshot };
    });

    return result;
  }

  async replayRun(
    runId: string,
    note?: string,
  ): Promise<{ run: RunRecord; publication: PublicationRecord; snapshot: ParliamentaryPublishedSnapshotRecord }> {
    const sourceInspection = await this.inspectRun(runId);
    if (!sourceInspection) {
      throw new Error(`Parliamentary run ${runId} was not found.`);
    }
    const rawArtifact = requireArtifact(sourceInspection.artifacts, RAW_CAPTURE_ARTIFACT_TYPE);
    await this.artifactStore.ensureBucket();

    const replayRun = await this.store.insertRun({
      id: createId("run"),
      stateCode: STATE_CODE,
      scopeType: SCOPE_TYPE,
      scopeCode: sourceInspection.run.scopeCode,
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
        buildReplayArtifactKey(this.config.DEPLOY_ENV, replayRun.id),
        { checksumsha256: rawArtifact.checksumSha256, replayofrunid: sourceInspection.run.id },
      );
      await this.store.insertArtifact({
        id: createId("artifact"),
        runId: replayRun.id,
        artifactType: RAW_CAPTURE_ARTIFACT_TYPE,
        s3Bucket: copiedArtifact.bucket,
        s3Key: copiedArtifact.key,
        checksumSha256: copiedArtifact.checksumSha256 || rawArtifact.checksumSha256,
        sizeBytes: copiedArtifact.sizeBytes || rawArtifact.sizeBytes,
        metadata: { replayOfRunId: sourceInspection.run.id, sourceArtifactId: rawArtifact.id },
      });

      const bundle = ParliamentaryCaptureBundleSchema.parse(
        await this.artifactStore.downloadJson(copiedArtifact.key, {
          expectedChecksumSha256: copiedArtifact.checksumSha256 || rawArtifact.checksumSha256,
        }),
      );
      const candidate = buildParliamentarySnapshotCandidate(bundle);
      const candidateArtifact = await this.artifactStore.uploadJson(
        buildCandidateArtifactKey(this.config.DEPLOY_ENV, candidate.metadata.scopeId, replayRun.id),
        candidate,
        { lineageid: candidate.metadata.lineageId, replayofrunid: sourceInspection.run.id },
      );
      await this.store.insertArtifact({
        id: createId("artifact"),
        runId: replayRun.id,
        artifactType: SNAPSHOT_CANDIDATE_ARTIFACT_TYPE,
        s3Bucket: candidateArtifact.bucket,
        s3Key: candidateArtifact.key,
        checksumSha256: candidateArtifact.checksumSha256,
        sizeBytes: candidateArtifact.sizeBytes,
        metadata: { lineageId: candidate.metadata.lineageId, replayOfRunId: sourceInspection.run.id },
      });
      await this.store.updateRun(replayRun.id, {
        status: "completed",
        qualityState: toRunQualityState(candidate.metadata.qualityState),
      });
      return this.publishRun(replayRun.id, note ?? `Replay publish of ${sourceInspection.run.id}`);
    } catch (error) {
      await this.store.updateRun(replayRun.id, {
        status: "failed",
        note: buildFailureNote("Parliamentary replay failed", error),
      });
      throw error;
    }
  }

  async rollbackPublication(publicationId: string, note?: string): Promise<PublicationRecord> {
    const target = await this.store.getPublicationById(publicationId);
    if (!target) {
      throw new Error(`Publication ${publicationId} was not found.`);
    }
    if (target.scopeType !== SCOPE_TYPE || target.scopeCode !== "ls-18-session-5") {
      throw new Error(`Publication ${publicationId} does not belong to the parliamentary Lok Sabha scope.`);
    }
    const latest = await this.store.getLatestPublication("ls-18-session-5", SCOPE_TYPE);
    if (!latest) {
      throw new Error("Rollback requires an existing parliamentary publication history.");
    }
    const targetSnapshot = await this.store.getParliamentaryPublishedSnapshotById(target.publishedSnapshotId);
    if (!targetSnapshot) {
      throw new Error(`Parliamentary snapshot ${target.publishedSnapshotId} was not found.`);
    }
    return this.store.insertPublication({
      id: createId("publication"),
      stateCode: STATE_CODE,
      scopeType: SCOPE_TYPE,
      scopeCode: "ls-18-session-5",
      publishedSnapshotId: targetSnapshot.id,
      action: "rollback",
      note: note ?? `Rollback to parliamentary publication ${target.id}`,
      previousPublicationId: latest.id,
    });
  }

  async listPublicationHistory(): Promise<ParliamentaryPublicationHistoryEntry[]> {
    const publications = await this.listPublications();
    return Promise.all(
      publications.map(async (publication, index) => {
        const snapshot = await this.store.getParliamentaryPublishedSnapshotById(publication.publishedSnapshotId);
        if (!snapshot) {
          throw new Error(`Parliamentary snapshot ${publication.publishedSnapshotId} was not found.`);
        }
        const run = await this.store.getRunById(snapshot.runId);
        if (!run) {
          throw new Error(`Run ${snapshot.runId} was not found for parliamentary snapshot ${snapshot.id}.`);
        }
        return {
          publication,
          snapshot,
          run: {
            id: run.id,
            status: run.status,
            replayOfRunId: run.replayOfRunId,
            sourceSnapshotAt: run.sourceSnapshotAt,
            methodologyVersion: run.methodologyVersion,
            qualityState: run.qualityState,
          },
          isActive: index === 0,
        };
      }),
    );
  }

  private async storeCaptureArtifacts(
    runId: string,
    bundle: ParliamentaryCaptureBundle,
    candidate: ReturnType<typeof ParliamentarySnapshotCandidateSchema.parse>,
  ): Promise<void> {
    const rawArtifact = await this.artifactStore.uploadJson(
      buildRawArtifactKey(this.config.DEPLOY_ENV, candidate.metadata.scopeId, runId),
      bundle,
      { capturedat: bundle.capturedAt, lineageid: candidate.metadata.lineageId },
    );
    await this.store.insertArtifact({
      id: createId("artifact"),
      runId,
      artifactType: RAW_CAPTURE_ARTIFACT_TYPE,
      s3Bucket: rawArtifact.bucket,
      s3Key: rawArtifact.key,
      checksumSha256: rawArtifact.checksumSha256,
      sizeBytes: rawArtifact.sizeBytes,
      metadata: { capturedAt: bundle.capturedAt, lineageId: candidate.metadata.lineageId },
    });

    const candidateArtifact = await this.artifactStore.uploadJson(
      buildCandidateArtifactKey(this.config.DEPLOY_ENV, candidate.metadata.scopeId, runId),
      candidate,
      { lineageid: candidate.metadata.lineageId },
    );
    await this.store.insertArtifact({
      id: createId("artifact"),
      runId,
      artifactType: SNAPSHOT_CANDIDATE_ARTIFACT_TYPE,
      s3Bucket: candidateArtifact.bucket,
      s3Key: candidateArtifact.key,
      checksumSha256: candidateArtifact.checksumSha256,
      sizeBytes: candidateArtifact.sizeBytes,
      metadata: { lineageId: candidate.metadata.lineageId },
    });
  }
}

function assertPublishableRun(
  inspection: ParliamentaryRunInspection,
): asserts inspection is ParliamentaryRunInspection & {
  candidate: ReturnType<typeof ParliamentarySnapshotCandidateSchema.parse>;
} {
  if (inspection.run.status !== "completed") {
    throw new Error(`Parliamentary run ${inspection.run.id} is not ready to publish. Current status: ${inspection.run.status}.`);
  }
  if (!inspection.candidate) {
    throw new Error(`Parliamentary run ${inspection.run.id} does not have a valid snapshot candidate.`);
  }
  if (inspection.candidate.metadata.qualityState === "blocked") {
    throw new Error(`Parliamentary run ${inspection.run.id} is blocked and cannot be published.`);
  }
}

function toRunQualityState(qualityState: "complete" | "partial" | "blocked") {
  return qualityState === "complete" ? ("complete" as const) : ("partial" as const);
}

function requireArtifact(artifacts: ArtifactRecord[], artifactType: string): ArtifactRecord {
  const artifact = artifacts.find((candidate) => candidate.artifactType === artifactType);
  if (!artifact) {
    throw new Error(`Required parliamentary artifact ${artifactType} was not found.`);
  }
  return artifact;
}

function buildRawArtifactKey(deployEnv: string, scopeId: string, runId: string): string {
  return `${deployEnv}/parliamentary/${scopeId}/runs/${runId}/capture.json`;
}

function buildCandidateArtifactKey(deployEnv: string, scopeId: string, runId: string): string {
  return `${deployEnv}/parliamentary/${scopeId}/runs/${runId}/candidate.json`;
}

function buildReplayArtifactKey(deployEnv: string, runId: string): string {
  return `${deployEnv}/parliamentary/ls-18-session-5/runs/${runId}/replay-capture.json`;
}

function buildFailureNote(prefix: string, error: unknown): string {
  return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}
