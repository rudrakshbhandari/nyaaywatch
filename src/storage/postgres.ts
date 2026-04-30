import type { Pool, PoolClient, QueryResultRow } from "pg";

import {
  HighCourtPublishedSnapshotSchema,
  type HighCourtPublishedSnapshot,
} from "../domain/high-court-snapshot-schema.js";
import { PublishedSnapshotSchema, type PublishedSnapshot, type QualityState } from "../domain/snapshot-schema.js";
import {
  SupremeCourtPublishedSnapshotSchema,
  type SupremeCourtPublishedSnapshot,
} from "../domain/supreme-court-snapshot-schema.js";
import { getStateProfileByCode } from "../geographies.js";
import { toIsoString } from "../lib/time.js";

type Queryable = Pick<Pool, "query"> | PoolClient;

export type ScopeType = "lower_court_state" | "high_court" | "supreme_court";

export interface RunRecord {
  id: string;
  scopeType: ScopeType;
  scopeCode: string;
  stateCode: string;
  sourceLabel: string;
  sourceSnapshotAt: string;
  methodologyVersion: string;
  status: string;
  qualityState: QualityState;
  replayOfRunId: string | null;
  note: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ArtifactRecord {
  id: string;
  runId: string;
  artifactType: string;
  s3Bucket: string;
  s3Key: string;
  checksumSha256: string;
  sizeBytes: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PublishedSnapshotRecord {
  id: string;
  runId: string;
  scopeType: ScopeType;
  scopeCode: string;
  stateCode: string;
  payloadVersion: number;
  payload: PublishedSnapshot;
  checksumSha256: string;
  createdAt: string;
}

export interface HighCourtPublishedSnapshotRecord {
  id: string;
  runId: string;
  scopeType: ScopeType;
  scopeCode: string;
  stateCode: string;
  payloadVersion: number;
  payload: HighCourtPublishedSnapshot;
  checksumSha256: string;
  createdAt: string;
}

export interface SupremeCourtPublishedSnapshotRecord {
  id: string;
  runId: string;
  scopeType: ScopeType;
  scopeCode: string;
  stateCode: string;
  payloadVersion: number;
  payload: SupremeCourtPublishedSnapshot;
  checksumSha256: string;
  createdAt: string;
}

export interface PublicationRecord {
  id: string;
  scopeType: ScopeType;
  scopeCode: string;
  stateCode: string;
  publishedSnapshotId: string;
  action: "publish" | "rollback";
  note: string | null;
  previousPublicationId: string | null;
  createdAt: string;
}

interface RunInsert {
  id: string;
  stateCode: string;
  scopeType?: ScopeType;
  scopeCode?: string;
  sourceLabel: string;
  sourceSnapshotAt: string;
  methodologyVersion: string;
  status: string;
  qualityState: QualityState;
  replayOfRunId?: string | null;
  note?: string | null;
}

interface RunUpdate {
  status: string;
  qualityState?: QualityState;
  note?: string | null;
}

interface ArtifactInsert {
  id: string;
  runId: string;
  artifactType: string;
  s3Bucket: string;
  s3Key: string;
  checksumSha256: string;
  sizeBytes: number;
  metadata?: Record<string, unknown>;
}

interface PublishedSnapshotInsert {
  id: string;
  runId: string;
  stateCode: string;
  scopeType?: ScopeType;
  scopeCode?: string;
  payloadVersion: number;
  payload: PublishedSnapshot;
  checksumSha256: string;
}

interface HighCourtPublishedSnapshotInsert {
  id: string;
  runId: string;
  stateCode: string;
  scopeType?: ScopeType;
  scopeCode?: string;
  payloadVersion: number;
  payload: HighCourtPublishedSnapshot;
  checksumSha256: string;
}

interface SupremeCourtPublishedSnapshotInsert {
  id: string;
  runId: string;
  stateCode: string;
  scopeType?: ScopeType;
  scopeCode?: string;
  payloadVersion: number;
  payload: SupremeCourtPublishedSnapshot;
  checksumSha256: string;
}

interface PublicationInsert {
  id: string;
  stateCode: string;
  scopeType?: ScopeType;
  scopeCode?: string;
  publishedSnapshotId: string;
  action: "publish" | "rollback";
  note?: string | null;
  previousPublicationId?: string | null;
}

export class PgWarehouseStore {
  constructor(
    private readonly db: Queryable,
    private readonly transactionPool?: Pool,
  ) {}

  static fromPool(pool: Pool): PgWarehouseStore {
    return new PgWarehouseStore(pool, pool);
  }

  async withTransaction<T>(fn: (tx: PgWarehouseStore) => Promise<T>): Promise<T> {
    if (!this.transactionPool) {
      return fn(this);
    }

    const client = await this.transactionPool.connect();
    try {
      await client.query("BEGIN");
      const txStore = new PgWarehouseStore(client);
      const result = await fn(txStore);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async insertRun(input: RunInsert): Promise<RunRecord> {
    const identity = resolveScopeIdentity(input.stateCode, input.scopeType, input.scopeCode);
    const result = await this.db.query(
      `INSERT INTO runs (
        id, scope_type, scope_code, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, replay_of_run_id, note, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $8 IN ('completed', 'published', 'replayed') THEN NOW() ELSE NULL END)
      RETURNING *`,
      [
        input.id,
        identity.scopeType,
        identity.scopeCode,
        input.stateCode,
        input.sourceLabel,
        input.sourceSnapshotAt,
        input.methodologyVersion,
        input.status,
        input.qualityState,
        input.replayOfRunId ?? null,
        input.note ?? null,
      ],
    );

    return mapRun(result.rows[0]);
  }

  async updateRun(runId: string, input: RunUpdate): Promise<RunRecord> {
    const result = await this.db.query(
      `UPDATE runs
      SET status = $2,
          quality_state = COALESCE($3, quality_state),
          note = COALESCE($4, note),
          completed_at = CASE WHEN $2 IN ('completed', 'published', 'replayed') THEN NOW() ELSE completed_at END
      WHERE id = $1`,
      [runId, input.status, input.qualityState ?? null, input.note ?? null],
    );

    const refreshed = await this.getRunById(runId);
    if (!refreshed) {
      throw new Error(`Run ${runId} was not found after update.`);
    }

    return refreshed;
  }

  async insertArtifact(input: ArtifactInsert): Promise<ArtifactRecord> {
    const result = await this.db.query(
      `INSERT INTO run_artifacts (
        id, run_id, artifact_type, s3_bucket, s3_key, checksum_sha256, size_bytes, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING *`,
      [
        input.id,
        input.runId,
        input.artifactType,
        input.s3Bucket,
        input.s3Key,
        input.checksumSha256,
        input.sizeBytes,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return mapArtifact(result.rows[0]);
  }

  async insertPublishedSnapshot(input: PublishedSnapshotInsert): Promise<PublishedSnapshotRecord> {
    const identity = resolveScopeIdentity(input.stateCode, input.scopeType, input.scopeCode);
    const result = await this.db.query(
      `INSERT INTO published_snapshots (
        id, run_id, scope_type, scope_code, state_code, payload_version, payload, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      RETURNING *`,
      [
        input.id,
        input.runId,
        identity.scopeType,
        identity.scopeCode,
        input.stateCode,
        input.payloadVersion,
        JSON.stringify(input.payload),
        input.checksumSha256,
      ],
    );

    return mapPublishedSnapshot(result.rows[0]);
  }

  async insertHighCourtPublishedSnapshot(input: HighCourtPublishedSnapshotInsert): Promise<HighCourtPublishedSnapshotRecord> {
    const identity = resolveScopeIdentity(input.stateCode, input.scopeType, input.scopeCode);
    const result = await this.db.query(
      `INSERT INTO published_snapshots (
        id, run_id, scope_type, scope_code, state_code, payload_version, payload, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      RETURNING *`,
      [
        input.id,
        input.runId,
        identity.scopeType,
        identity.scopeCode,
        input.stateCode,
        input.payloadVersion,
        JSON.stringify(input.payload),
        input.checksumSha256,
      ],
    );

    return mapHighCourtPublishedSnapshot(result.rows[0]);
  }

  async insertSupremeCourtPublishedSnapshot(input: SupremeCourtPublishedSnapshotInsert): Promise<SupremeCourtPublishedSnapshotRecord> {
    const identity = resolveScopeIdentity(input.stateCode, input.scopeType, input.scopeCode);
    const result = await this.db.query(
      `INSERT INTO published_snapshots (
        id, run_id, scope_type, scope_code, state_code, payload_version, payload, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      RETURNING *`,
      [
        input.id,
        input.runId,
        identity.scopeType,
        identity.scopeCode,
        input.stateCode,
        input.payloadVersion,
        JSON.stringify(input.payload),
        input.checksumSha256,
      ],
    );

    return mapSupremeCourtPublishedSnapshot(result.rows[0]);
  }

  async insertPublication(input: PublicationInsert): Promise<PublicationRecord> {
    const identity = resolveScopeIdentity(input.stateCode, input.scopeType, input.scopeCode);
    const result = await this.db.query(
      `INSERT INTO publication_history (
        id, scope_type, scope_code, state_code, published_snapshot_id, action, note, previous_publication_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        input.id,
        identity.scopeType,
        identity.scopeCode,
        input.stateCode,
        input.publishedSnapshotId,
        input.action,
        input.note ?? null,
        input.previousPublicationId ?? null,
      ],
    );

    return mapPublication(result.rows[0]);
  }

  async getRunById(runId: string): Promise<RunRecord | null> {
    const result = await this.db.query("SELECT * FROM runs WHERE id = $1", [runId]);
    return result.rows[0] ? mapRun(result.rows[0]) : null;
  }

  async listRuns(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<RunRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM runs WHERE scope_type = $1 AND scope_code = $2 ORDER BY created_at DESC",
      [scopeType, scopeCode],
    );
    return result.rows.map(mapRun);
  }

  async listArtifactsForRun(runId: string): Promise<ArtifactRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM run_artifacts WHERE run_id = $1 ORDER BY created_at ASC",
      [runId],
    );
    return result.rows.map(mapArtifact);
  }

  async getSnapshotForRun(runId: string): Promise<PublishedSnapshotRecord | null> {
    const result = await this.db.query(
      "SELECT * FROM published_snapshots WHERE run_id = $1 ORDER BY created_at DESC LIMIT 1",
      [runId],
    );
    return result.rows[0] ? mapPublishedSnapshot(result.rows[0]) : null;
  }

  async getPublishedSnapshotById(snapshotId: string): Promise<PublishedSnapshotRecord | null> {
    const result = await this.db.query("SELECT * FROM published_snapshots WHERE id = $1", [snapshotId]);
    return result.rows[0] ? mapPublishedSnapshot(result.rows[0]) : null;
  }

  async getHighCourtPublishedSnapshotById(snapshotId: string): Promise<HighCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query("SELECT * FROM published_snapshots WHERE id = $1", [snapshotId]);
    return result.rows[0] ? mapHighCourtPublishedSnapshot(result.rows[0]) : null;
  }

  async getLatestPublishedSnapshot(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<PublishedSnapshotRecord | null> {
    const result = await this.db.query(
      `SELECT ps.*
      FROM publication_history ph
      JOIN published_snapshots ps ON ps.id = ph.published_snapshot_id
      WHERE ph.scope_type = $1 AND ph.scope_code = $2
      ORDER BY ph.created_at DESC
      LIMIT 1`,
      [scopeType, scopeCode],
    );

    return result.rows[0] ? mapPublishedSnapshot(result.rows[0]) : null;
  }

  async getLatestHighCourtPublishedSnapshot(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<HighCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query(
      `SELECT ps.*
      FROM publication_history ph
      JOIN published_snapshots ps ON ps.id = ph.published_snapshot_id
      WHERE ph.scope_type = $1 AND ph.scope_code = $2
      ORDER BY ph.created_at DESC
      LIMIT 1`,
      [scopeType, scopeCode],
    );

    return result.rows[0] ? mapHighCourtPublishedSnapshot(result.rows[0]) : null;
  }

  async getLatestSupremeCourtPublishedSnapshot(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<SupremeCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query(
      `SELECT ps.*
      FROM publication_history ph
      JOIN published_snapshots ps ON ps.id = ph.published_snapshot_id
      WHERE ph.scope_type = $1 AND ph.scope_code = $2
      ORDER BY ph.created_at DESC
      LIMIT 1`,
      [scopeType, scopeCode],
    );

    return result.rows[0] ? mapSupremeCourtPublishedSnapshot(result.rows[0]) : null;
  }

  async getLatestPublication(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<PublicationRecord | null> {
    const result = await this.db.query(
      `SELECT *
      FROM publication_history
      WHERE scope_type = $1 AND scope_code = $2
      ORDER BY created_at DESC
      LIMIT 1`,
      [scopeType, scopeCode],
    );

    return result.rows[0] ? mapPublication(result.rows[0]) : null;
  }

  async getPublicationById(publicationId: string): Promise<PublicationRecord | null> {
    const result = await this.db.query("SELECT * FROM publication_history WHERE id = $1", [publicationId]);
    return result.rows[0] ? mapPublication(result.rows[0]) : null;
  }

  async listPublications(scopeCode: string, scopeType: ScopeType = inferScopeType(scopeCode)): Promise<PublicationRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM publication_history WHERE scope_type = $1 AND scope_code = $2 ORDER BY created_at DESC",
      [scopeType, scopeCode],
    );
    return result.rows.map(mapPublication);
  }

  async getHighCourtSnapshotForRun(runId: string): Promise<HighCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query(
      "SELECT * FROM published_snapshots WHERE run_id = $1 ORDER BY created_at DESC LIMIT 1",
      [runId],
    );
    return result.rows[0] ? mapHighCourtPublishedSnapshot(result.rows[0]) : null;
  }

  async getSupremeCourtPublishedSnapshotById(snapshotId: string): Promise<SupremeCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query("SELECT * FROM published_snapshots WHERE id = $1", [snapshotId]);
    return result.rows[0] ? mapSupremeCourtPublishedSnapshot(result.rows[0]) : null;
  }

  async getSupremeCourtSnapshotForRun(runId: string): Promise<SupremeCourtPublishedSnapshotRecord | null> {
    const result = await this.db.query(
      "SELECT * FROM published_snapshots WHERE run_id = $1 ORDER BY created_at DESC LIMIT 1",
      [runId],
    );
    return result.rows[0] ? mapSupremeCourtPublishedSnapshot(result.rows[0]) : null;
  }
}

function mapRun(row: QueryResultRow): RunRecord {
  const scopeType = parseScopeType(row.scope_type, row.state_code);
  const scopeCode = row.scope_code ?? row.state_code;
  return {
    id: row.id,
    scopeType,
    scopeCode,
    stateCode: row.state_code,
    sourceLabel: row.source_label,
    sourceSnapshotAt: toIsoString(row.source_snapshot_at),
    methodologyVersion: row.methodology_version,
    status: row.status,
    qualityState: row.quality_state,
    replayOfRunId: row.replay_of_run_id,
    note: row.note,
    createdAt: toIsoString(row.created_at),
    completedAt: row.completed_at ? toIsoString(row.completed_at) : null,
  };
}

function mapArtifact(row: QueryResultRow): ArtifactRecord {
  return {
    id: row.id,
    runId: row.run_id,
    artifactType: row.artifact_type,
    s3Bucket: row.s3_bucket,
    s3Key: row.s3_key,
    checksumSha256: row.checksum_sha256,
    sizeBytes: Number(row.size_bytes),
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
    createdAt: toIsoString(row.created_at),
  };
}

function mapPublishedSnapshot(row: QueryResultRow): PublishedSnapshotRecord {
  const payload = materializeLowerCourtPayload(row);
  const scopeType = parseScopeType(row.scope_type, row.state_code);
  const scopeCode = row.scope_code ?? row.state_code;
  return {
    id: row.id,
    runId: row.run_id,
    scopeType,
    scopeCode,
    stateCode: row.state_code,
    payloadVersion: Number(row.payload_version),
    payload,
    checksumSha256: row.checksum_sha256,
    createdAt: toIsoString(row.created_at),
  };
}

function materializeLowerCourtPayload(row: QueryResultRow): PublishedSnapshot {
  const rawPayload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return PublishedSnapshotSchema.parse(rawPayload);
  }

  const payload = rawPayload as Record<string, unknown>;
  const rawSnapshot = payload.snapshot;
  if (!rawSnapshot || typeof rawSnapshot !== "object" || Array.isArray(rawSnapshot)) {
    return PublishedSnapshotSchema.parse(rawPayload);
  }

  const snapshot = rawSnapshot as Record<string, unknown>;
  const rowStateCode = typeof row.state_code === "string" ? row.state_code : "";
  const profile = getStateProfileByCode(rowStateCode);
  return PublishedSnapshotSchema.parse({
    ...payload,
    snapshot: {
      ...snapshot,
      stateCode: snapshot.stateCode ?? profile?.stateCode ?? rowStateCode,
      stateName: snapshot.stateName ?? profile?.stateName,
    },
  });
}

function mapHighCourtPublishedSnapshot(row: QueryResultRow): HighCourtPublishedSnapshotRecord {
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  const scopeType = parseScopeType(row.scope_type, row.state_code);
  const scopeCode = row.scope_code ?? row.state_code;
  return {
    id: row.id,
    runId: row.run_id,
    scopeType,
    scopeCode,
    stateCode: row.state_code,
    payloadVersion: Number(row.payload_version),
    payload: HighCourtPublishedSnapshotSchema.parse(payload),
    checksumSha256: row.checksum_sha256,
    createdAt: toIsoString(row.created_at),
  };
}

function mapSupremeCourtPublishedSnapshot(row: QueryResultRow): SupremeCourtPublishedSnapshotRecord {
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  const scopeType = parseScopeType(row.scope_type, row.state_code);
  const scopeCode = row.scope_code ?? row.state_code;
  return {
    id: row.id,
    runId: row.run_id,
    scopeType,
    scopeCode,
    stateCode: row.state_code,
    payloadVersion: Number(row.payload_version),
    payload: SupremeCourtPublishedSnapshotSchema.parse(payload),
    checksumSha256: row.checksum_sha256,
    createdAt: toIsoString(row.created_at),
  };
}

function mapPublication(row: QueryResultRow): PublicationRecord {
  const scopeType = parseScopeType(row.scope_type, row.state_code);
  const scopeCode = row.scope_code ?? row.state_code;
  return {
    id: row.id,
    scopeType,
    scopeCode,
    stateCode: row.state_code,
    publishedSnapshotId: row.published_snapshot_id,
    action: row.action,
    note: row.note,
    previousPublicationId: row.previous_publication_id,
    createdAt: toIsoString(row.created_at),
  };
}

function resolveScopeIdentity(stateCode: string, scopeType?: ScopeType, scopeCode?: string): { scopeType: ScopeType; scopeCode: string } {
  return {
    scopeType: scopeType ?? inferScopeType(stateCode),
    scopeCode: scopeCode ?? stateCode,
  };
}

function inferScopeType(stateCode: string): ScopeType {
  if (stateCode === "SCI") {
    return "supreme_court";
  }

  if (stateCode.endsWith("HC")) {
    return "high_court";
  }

  return "lower_court_state";
}

function parseScopeType(value: unknown, stateCode: string): ScopeType {
  if (value === "lower_court_state" || value === "high_court" || value === "supreme_court") {
    return value;
  }

  return inferScopeType(stateCode);
}
