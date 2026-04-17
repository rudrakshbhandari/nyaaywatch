import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DataType, newDb } from "pg-mem";
import { type Pool } from "pg";

import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createFixtureSourceClient } from "../src/dev/fixtures.js";
import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";
import { getStateProfile, listStateProfiles, type SupportedStateCode } from "../src/geographies.js";
import { createApp } from "../src/api/app.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function createTestContext(options: { stateCode?: SupportedStateCode } = {}) {
  const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "pg-mem",
  });

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Pool;
  await runMigrations(pool);

  const config = createTestConfig(options.stateCode);
  const profile = getStateProfile(config.STATE_CODE);
  const store = PgWarehouseStore.fromPool(pool);
  const artifactStore = new InMemoryArtifactStore();
  const sourceClient = createFixtureSourceClient(config.STATE_CODE);
  const service = new PublishedSnapshotService(config, profile, store, artifactStore, sourceClient);
  const publicServices = Object.fromEntries(
    listStateProfiles().map((publicProfile) => {
      const publicService =
        publicProfile.stateCode === config.STATE_CODE
          ? service
          : new PublishedSnapshotService(
              { ...config, STATE_CODE: publicProfile.stateCode } satisfies AppConfig,
              publicProfile,
              store,
              artifactStore,
              createFixtureSourceClient(publicProfile.stateCode),
            );
      return [publicProfile.stateCode, publicService];
    }),
  ) as Partial<Record<SupportedStateCode, PublishedSnapshotService>>;

  return { pool, config, service, publicServices };
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

export async function insertPublishedSnapshot(
  pool: Pool,
  input: {
    runId: string;
    snapshotId: string;
    publicationId: string;
    stateCode: SupportedStateCode;
    payload: PublishedSnapshot;
    action?: "publish" | "rollback";
    note?: string;
    previousPublicationId?: string | null;
  },
) {
  await pool.query(
    `INSERT INTO runs (
      id, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      input.runId,
      input.stateCode,
      input.payload.snapshot.sourceName,
      input.payload.snapshot.sourceSnapshotAt,
      input.payload.snapshot.methodologyVersion,
      "published",
      input.payload.snapshot.qualityState,
      input.note ?? "Inserted published snapshot for tests",
    ],
  );

  await pool.query(
    `INSERT INTO published_snapshots (
      id, run_id, state_code, payload_version, payload, checksum_sha256
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [
      input.snapshotId,
      input.runId,
      input.stateCode,
      1,
      JSON.stringify(input.payload),
      `checksum-${input.snapshotId}`,
    ],
  );

  await pool.query(
    `INSERT INTO publication_history (
      id, state_code, published_snapshot_id, action, note, previous_publication_id
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.publicationId,
      input.stateCode,
      input.snapshotId,
      input.action ?? "publish",
      input.note ?? "Inserted publication for tests",
      input.previousPublicationId ?? null,
    ],
  );
}

export function createTestApp(
  config: AppConfig,
  service: PublishedSnapshotService,
  publicServices?: Partial<Record<SupportedStateCode, PublishedSnapshotService>>,
) {
  return createApp(config, service, publicServices);
}

export function createScopedTestService(
  pool: Pool,
  stateCode: SupportedStateCode,
  overrides: Partial<AppConfig> = {},
) {
  const config = createTestConfig(stateCode);
  const mergedConfig = { ...config, ...overrides, STATE_CODE: stateCode } satisfies AppConfig;
  const profile = getStateProfile(stateCode);

  return new PublishedSnapshotService(
    mergedConfig,
    profile,
    PgWarehouseStore.fromPool(pool),
    new InMemoryArtifactStore(),
    createFixtureSourceClient(stateCode),
  );
}

function createTestConfig(stateCode: SupportedStateCode = "HP"): AppConfig {
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
    STATE_CODE: stateCode,
    CANONICAL_HOST: "nyaaywatch.in",
    LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
  });
}

function loadFixturePublishedSnapshot(): PublishedSnapshot {
  return JSON.parse(readFileSync(join(repoRoot, "fixtures/himachal/published-snapshot.json"), "utf8")) as PublishedSnapshot;
}

export function buildPunjabTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "PB",
      stateName: "Punjab",
      sourceName: "NJDG Punjab district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-16T22:01:41.026Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Punjab",
      publishedFromRunId: "run_726b1bb9-04c8-43dc-9dfe-c977abf812e0",
    },
    stats: {
      pendingCases: 961280,
      disposalRate: 102.7,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "ludhiana",
        districtName: "Ludhiana",
        rank: 1,
        backlogCases: 240926,
        disposalRate: 46.4,
        medianAgeDays: 183,
        filingVsDisposalGap: 53.6,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among the state's biggest.",
        summary:
          "Ludhiana has 2,40,926 cases waiting. A typical pending case falls around 183 days old, and the district cleared 46.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "amritsar",
        districtName: "Amritsar",
        rank: 2,
        backlogCases: 81337,
        disposalRate: 134.5,
        medianAgeDays: 730,
        filingVsDisposalGap: -34.5,
        flagReason:
          "People appear to be waiting longer here than in much of Punjab, based on the latest published snapshot.",
        summary:
          "Amritsar has 81,337 cases waiting. A typical pending case falls around 730 days old, and the district cleared 134.5% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "jalandhar",
        districtName: "Jalandhar",
        rank: 3,
        backlogCases: 79899,
        disposalRate: 79.1,
        medianAgeDays: 183,
        filingVsDisposalGap: 20.9,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among the state's biggest.",
        summary:
          "Jalandhar has 79,899 cases waiting. A typical pending case falls around 183 days old, and the district cleared 79.1% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 961280,
        disposalRate: 102.7,
      },
    ],
  };
}
