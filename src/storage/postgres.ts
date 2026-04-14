import type { Pool, PoolClient, QueryResultRow } from "pg";

import { PublishedSnapshotSchema, type PublishedSnapshot, type QualityState } from "../domain/snapshot-schema.js";
import { toIsoString } from "../lib/time.js";

type Queryable = Pick<Pool, "query"> | PoolClient;

export interface RunRecord {
  id: string;
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
  stateCode: string;
  payloadVersion: number;
  payload: PublishedSnapshot;
  checksumSha256: string;
  createdAt: string;
}

export interface PublicationRecord {
  id: string;
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
  sourceLabel: string;
  sourceSnapshotAt: string;
  methodologyVersion: string;
  status: string;
  qualityState: QualityState;
  replayOfRunId?: string | null;
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
  payloadVersion: number;
  payload: PublishedSnapshot;
  checksumSha256: string;
}

interface PublicationInsert {
  id: string;
  stateCode: string;
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
    const result = await this.db.query(
      `INSERT INTO runs (
        id, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, replay_of_run_id, note, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $6 IN ('completed', 'published', 'replayed') THEN NOW() ELSE NULL END)
      RETURNING *`,
      [
        input.id,
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

  async updateRunStatus(runId: string, status: string): Promise<void> {
    await this.db.query(
      `UPDATE runs
      SET status = $2,
          completed_at = CASE WHEN $2 IN ('completed', 'published', 'replayed') THEN NOW() ELSE completed_at END
      WHERE id = $1`,
      [runId, status],
    );
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
    const result = await this.db.query(
      `INSERT INTO published_snapshots (
        id, run_id, state_code, payload_version, payload, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING *`,
      [
        input.id,
        input.runId,
        input.stateCode,
        input.payloadVersion,
        JSON.stringify(input.payload),
        input.checksumSha256,
      ],
    );

    return mapPublishedSnapshot(result.rows[0]);
  }

  async insertPublication(input: PublicationInsert): Promise<PublicationRecord> {
    const result = await this.db.query(
      `INSERT INTO publication_history (
        id, state_code, published_snapshot_id, action, note, previous_publication_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        input.id,
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

  async listRuns(stateCode: string): Promise<RunRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM runs WHERE state_code = $1 ORDER BY created_at DESC",
      [stateCode],
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

  async getLatestPublishedSnapshot(stateCode: string): Promise<PublishedSnapshotRecord | null> {
    const result = await this.db.query(
      `SELECT ps.*
      FROM publication_history ph
      JOIN published_snapshots ps ON ps.id = ph.published_snapshot_id
      WHERE ph.state_code = $1
      ORDER BY ph.created_at DESC
      LIMIT 1`,
      [stateCode],
    );

    return result.rows[0] ? mapPublishedSnapshot(result.rows[0]) : null;
  }

  async getLatestPublication(stateCode: string): Promise<PublicationRecord | null> {
    const result = await this.db.query(
      `SELECT *
      FROM publication_history
      WHERE state_code = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [stateCode],
    );

    return result.rows[0] ? mapPublication(result.rows[0]) : null;
  }

  async getPublicationById(publicationId: string): Promise<PublicationRecord | null> {
    const result = await this.db.query("SELECT * FROM publication_history WHERE id = $1", [publicationId]);
    return result.rows[0] ? mapPublication(result.rows[0]) : null;
  }

  async listPublications(stateCode: string): Promise<PublicationRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM publication_history WHERE state_code = $1 ORDER BY created_at DESC",
      [stateCode],
    );
    return result.rows.map(mapPublication);
  }
}

function mapRun(row: QueryResultRow): RunRecord {
  return {
    id: row.id,
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
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return {
    id: row.id,
    runId: row.run_id,
    stateCode: row.state_code,
    payloadVersion: Number(row.payload_version),
    payload: PublishedSnapshotSchema.parse(payload),
    checksumSha256: row.checksum_sha256,
    createdAt: toIsoString(row.created_at),
  };
}

function mapPublication(row: QueryResultRow): PublicationRecord {
  return {
    id: row.id,
    stateCode: row.state_code,
    publishedSnapshotId: row.published_snapshot_id,
    action: row.action,
    note: row.note,
    previousPublicationId: row.previous_publication_id,
    createdAt: toIsoString(row.created_at),
  };
}
