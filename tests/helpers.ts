import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DataType, newDb } from "pg-mem";
import { type Pool } from "pg";

import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createFixtureSourceClient } from "../src/dev/fixtures.js";
import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";
import { createApp } from "../src/api/app.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function createTestContext() {
  const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "pg-mem",
  });

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Pool;
  await runMigrations(pool);

  const config = createTestConfig();
  const store = PgWarehouseStore.fromPool(pool);
  const artifactStore = new InMemoryArtifactStore();
  const sourceClient = createFixtureSourceClient();
  const service = new PublishedSnapshotService(config, store, artifactStore, sourceClient);

  return { pool, config, service };
}

export async function seedTestSnapshot(service: PublishedSnapshotService) {
  const captured = await service.captureRun("Test fixture capture.");
  return service.publishRun(captured.run.id, "Test fixture publish.");
}

export async function insertHistoricalPublishedSnapshot(
  pool: Pool,
  overrides: {
    runId: string;
    snapshotId: string;
    publicationId: string;
    sourceSnapshotAt: string;
    publishedAt: string;
    methodologyVersion?: string;
    qualityState?: "complete" | "partial" | "stale";
    pendingCases?: number;
    flaggedDistricts?: number;
    districtOverrides?: Partial<Record<string, Partial<PublishedSnapshot["districts"][number]>>>;
  },
) {
  const payload = loadFixturePublishedSnapshot();
  payload.snapshot.sourceSnapshotAt = overrides.sourceSnapshotAt;
  payload.snapshot.publishedAt = overrides.publishedAt;
  payload.snapshot.methodologyVersion = overrides.methodologyVersion ?? payload.snapshot.methodologyVersion;
  payload.snapshot.qualityState = overrides.qualityState ?? payload.snapshot.qualityState;
  payload.snapshot.freshnessDays = 0;
  payload.stats.pendingCases = overrides.pendingCases ?? payload.stats.pendingCases;
  payload.stats.flaggedDistricts = overrides.flaggedDistricts ?? payload.stats.flaggedDistricts;
  payload.districts = payload.districts.map((district) => ({
    ...district,
    ...(overrides.districtOverrides?.[district.districtId] ?? {}),
  }));
  payload.trends = payload.trends
    .map((point, index) =>
      index === payload.trends.length - 1
        ? {
            ...point,
            snapshotDate: overrides.sourceSnapshotAt,
            pendingCases: payload.stats.pendingCases,
          }
        : point,
    )
    .filter((point) => point.snapshotDate <= overrides.sourceSnapshotAt);

  await pool.query(
    `INSERT INTO runs (
      id, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      overrides.runId,
      "HP",
      payload.snapshot.sourceName,
      overrides.sourceSnapshotAt,
      payload.snapshot.methodologyVersion,
      "published",
      payload.snapshot.qualityState,
      "Historical published snapshot for tests",
    ],
  );

  await pool.query(
    `INSERT INTO published_snapshots (
      id, run_id, state_code, payload_version, payload, checksum_sha256
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [overrides.snapshotId, overrides.runId, "HP", 1, JSON.stringify(payload), `checksum-${overrides.snapshotId}`],
  );

  await pool.query(
    `INSERT INTO publication_history (
      id, state_code, published_snapshot_id, action, note
    ) VALUES ($1, $2, $3, $4, $5)`,
    [overrides.publicationId, "HP", overrides.snapshotId, "publish", "Historical publication for tests"],
  );
}

export function createTestApp(config: AppConfig, service: PublishedSnapshotService) {
  return createApp(config, service);
}

function createTestConfig(): AppConfig {
  return loadConfig({
    NODE_ENV: "test",
    PORT: "3000",
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    S3_BUCKET: "nyaaywatch-test-artifacts",
    DEPLOY_ENV: "dev",
    OPERATOR_API_TOKEN: "operator-test-token",
    STATE_CODE: "HP",
    CANONICAL_HOST: "nyaaywatch.in",
    LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
  });
}

function loadFixturePublishedSnapshot(): PublishedSnapshot {
  return JSON.parse(readFileSync(join(repoRoot, "fixtures/himachal/published-snapshot.json"), "utf8")) as PublishedSnapshot;
}
