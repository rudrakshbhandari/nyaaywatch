import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DataType, newDb } from "pg-mem";
import { type Pool } from "pg";

import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createFixtureSourceClient } from "../src/dev/fixtures.js";
import type { HighCourtCaptureBundle } from "../src/domain/high-court-capture-schema.js";
import type { SupremeCourtCaptureBundle } from "../src/domain/supreme-court-capture-schema.js";
import { getHighCourtProfile, listHighCourtProfiles, type SupportedHighCourtCode } from "../src/high-courts.js";
import type { HighCourtSourceClient } from "../src/ingest/high-court-source-client.js";
import type { SupremeCourtSourceClient } from "../src/ingest/supreme-court-source-client.js";
import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";
import { getStateProfile, listStateProfiles, type SupportedStateCode } from "../src/geographies.js";
import { createApp } from "../src/api/app.js";
import { PublishedHighCourtSnapshotService } from "../src/services/published-high-court-snapshot-service.js";
import { PublishedSupremeCourtSnapshotService } from "../src/services/published-supreme-court-snapshot-service.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";
import { getSupremeCourtProfile } from "../src/supreme-court.js";
import { buildHighCourtCaptureBundle } from "./fixtures/high-court.js";
import { buildSupremeCourtCaptureBundle } from "./fixtures/supreme-court.js";

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
  const highCourtServices = Object.fromEntries(
    listHighCourtProfiles().map((highCourtProfile) => [
      highCourtProfile.courtCode,
      new PublishedHighCourtSnapshotService(
        config,
        highCourtProfile,
        store,
        artifactStore,
        createFixtureHighCourtSourceClient(highCourtProfile.courtCode),
      ),
    ]),
  ) as Partial<Record<SupportedHighCourtCode, PublishedHighCourtSnapshotService>>;
  const supremeCourtService = new PublishedSupremeCourtSnapshotService(
    config,
    getSupremeCourtProfile(),
    store,
    artifactStore,
    createFixtureSupremeCourtSourceClient(),
  );

  return { pool, config, service, publicServices, highCourtServices, supremeCourtService };
}

export async function seedTestSnapshot(service: PublishedSnapshotService) {
  const captured = await service.captureRun("Test fixture capture.");
  return service.publishRun(captured.run.id, "Test fixture publish.");
}

export async function seedTestHighCourtSnapshot(service: PublishedHighCourtSnapshotService) {
  const captured = await service.captureRun("Test High Court fixture capture.");
  return service.publishRun(captured.run.id, "Test High Court fixture publish.");
}

export async function seedTestSupremeCourtSnapshot(service: PublishedSupremeCourtSnapshotService) {
  const captured = await service.captureRun("Test Supreme Court fixture capture.");
  return service.publishRun(captured.run.id, "Test Supreme Court fixture publish.");
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
      id, scope_type, scope_code, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [
      overrides.runId,
      "lower_court_state",
      "HP",
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
      id, run_id, scope_type, scope_code, state_code, payload_version, payload, checksum_sha256
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      overrides.snapshotId,
      overrides.runId,
      "lower_court_state",
      "HP",
      "HP",
      1,
      JSON.stringify(payload),
      `checksum-${overrides.snapshotId}`,
    ],
  );

  await pool.query(
    `INSERT INTO publication_history (
      id, scope_type, scope_code, state_code, published_snapshot_id, action, note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      overrides.publicationId,
      "lower_court_state",
      "HP",
      "HP",
      overrides.snapshotId,
      "publish",
      "Historical publication for tests",
    ],
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
      id, scope_type, scope_code, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [
      input.runId,
      "lower_court_state",
      input.stateCode,
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
      id, run_id, scope_type, scope_code, state_code, payload_version, payload, checksum_sha256
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      input.snapshotId,
      input.runId,
      "lower_court_state",
      input.stateCode,
      input.stateCode,
      1,
      JSON.stringify(input.payload),
      `checksum-${input.snapshotId}`,
    ],
  );

  await pool.query(
    `INSERT INTO publication_history (
      id, scope_type, scope_code, state_code, published_snapshot_id, action, note, previous_publication_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.publicationId,
      "lower_court_state",
      input.stateCode,
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
  highCourtServices?: Partial<Record<SupportedHighCourtCode, PublishedHighCourtSnapshotService>>,
  supremeCourtService?: PublishedSupremeCourtSnapshotService,
  pool?: Pool,
) {
  return createApp(config, service, publicServices, highCourtServices, supremeCourtService, pool);
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

function createFixtureHighCourtSourceClient(courtCode: SupportedHighCourtCode): HighCourtSourceClient {
  const profile = getHighCourtProfile(courtCode);

  return {
    async captureLatest(): Promise<HighCourtCaptureBundle> {
      return buildHighCourtCaptureBundle(profile);
    },
  };
}

function createFixtureSupremeCourtSourceClient(): SupremeCourtSourceClient {
  return {
    async captureLatest(): Promise<SupremeCourtCaptureBundle> {
      return buildSupremeCourtCaptureBundle();
    },
  };
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

export function buildLadakhTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "LA",
      stateName: "Ladakh",
      sourceName: "NJDG Ladakh district dashboard",
      sourceSnapshotAt: "2026-04-22T00:00:00.000Z",
      publishedAt: "2026-04-23T21:40:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 1,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Ladakh",
      publishedFromRunId: "run_c27551d1-fa94-4bd9-bc3f-bff4ce75d061",
    },
    stats: {
      pendingCases: 1659,
      disposalRate: 104.3,
      medianCaseAgeDays: 365,
      flaggedDistricts: 1,
    },
    districts: [
      {
        districtId: "leh",
        districtName: "Leh",
        rank: 1,
        backlogCases: 1034,
        disposalRate: 96.1,
        medianAgeDays: 365,
        filingVsDisposalGap: 3.9,
        flagReason:
          "This district carries most of Ladakh's pending lower-court caseload in the latest published snapshot.",
        summary:
          "Leh has 1,034 cases waiting. A typical pending case falls around 365 days old, and the district cleared 96.1% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "kargil",
        districtName: "Kargil",
        rank: 2,
        backlogCases: 625,
        disposalRate: 118.2,
        medianAgeDays: 183,
        filingVsDisposalGap: -18.2,
        flagReason:
          "Kargil is smaller than Leh in this published snapshot, but remains visible for geography-level parity.",
        summary:
          "Kargil has 625 cases waiting. A typical pending case falls around 183 days old, and the district cleared 118.2% as many cases as it received last month.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-22T00:00:00.000Z",
        pendingCases: 1659,
        disposalRate: 104.3,
      },
    ],
  };
}

export function buildHaryanaTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "HR",
      stateName: "Haryana",
      sourceName: "NJDG Haryana district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-17T09:32:11.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Haryana",
      publishedFromRunId: "run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e",
    },
    stats: {
      pendingCases: 1509969,
      disposalRate: 97.4,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "faridabad",
        districtName: "Faridabad",
        rank: 1,
        backlogCases: 219876,
        disposalRate: 88.4,
        medianAgeDays: 183,
        filingVsDisposalGap: 11.6,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Haryana's biggest.",
        summary:
          "Faridabad has 2,19,876 cases waiting. A typical pending case falls around 183 days old, and the district cleared 88.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "ambala",
        districtName: "Ambala",
        rank: 2,
        backlogCases: 110452,
        disposalRate: 104.7,
        medianAgeDays: 730,
        filingVsDisposalGap: -4.7,
        flagReason:
          "People appear to be waiting longer here than in much of Haryana, based on the latest published snapshot.",
        summary:
          "Ambala has 1,10,452 cases waiting. A typical pending case falls around 730 days old, and the district cleared 104.7% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "karnal",
        districtName: "Karnal",
        rank: 3,
        backlogCases: 93840,
        disposalRate: 79.2,
        medianAgeDays: 365,
        filingVsDisposalGap: 20.8,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Karnal has 93,840 cases waiting. A typical pending case falls around 365 days old, and the district cleared 79.2% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 1509969,
        disposalRate: 97.4,
      },
    ],
  };
}

export function buildAssamTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "AS",
      stateName: "Assam",
      sourceName: "NJDG Assam district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-17T14:12:03.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Assam",
      publishedFromRunId: "run_32e2194a-027d-4ec2-8d50-b3c282446b90",
    },
    stats: {
      pendingCases: 581244,
      disposalRate: 104.0,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "tinsukia",
        districtName: "Tinsukia",
        rank: 1,
        backlogCases: 48211,
        disposalRate: 82.4,
        medianAgeDays: 183,
        filingVsDisposalGap: 17.6,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Assam's biggest.",
        summary:
          "Tinsukia has 48,211 cases waiting. A typical pending case falls around 183 days old, and the district cleared 82.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "sivasagar",
        districtName: "Sivasagar",
        rank: 2,
        backlogCases: 26604,
        disposalRate: 107.9,
        medianAgeDays: 730,
        filingVsDisposalGap: -7.9,
        flagReason:
          "People appear to be waiting longer here than in much of Assam, based on the latest published snapshot.",
        summary:
          "Sivasagar has 26,604 cases waiting. A typical pending case falls around 730 days old, and the district cleared 107.9% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "lakhimpur",
        districtName: "Lakhimpur",
        rank: 3,
        backlogCases: 21897,
        disposalRate: 76.3,
        medianAgeDays: 365,
        filingVsDisposalGap: 23.7,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Lakhimpur has 21,897 cases waiting. A typical pending case falls around 365 days old, and the district cleared 76.3% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 581244,
        disposalRate: 104.0,
      },
    ],
  };
}

export function buildTamilNaduTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "TN",
      stateName: "Tamil Nadu",
      sourceName: "NJDG Tamil Nadu district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-17T22:18:09.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Tamil Nadu",
      publishedFromRunId: "run_329a8b74-2b9d-4c33-ba2f-46b19186935c",
    },
    stats: {
      pendingCases: 1746162,
      disposalRate: 101.6,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "chennai",
        districtName: "Chennai",
        rank: 1,
        backlogCases: 284613,
        disposalRate: 88.9,
        medianAgeDays: 183,
        filingVsDisposalGap: 11.1,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Tamil Nadu's biggest.",
        summary:
          "Chennai has 2,84,613 cases waiting. A typical pending case falls around 183 days old, and the district cleared 88.9% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "coimbatore",
        districtName: "Coimbatore",
        rank: 2,
        backlogCases: 132904,
        disposalRate: 107.8,
        medianAgeDays: 730,
        filingVsDisposalGap: -7.8,
        flagReason:
          "People appear to be waiting longer here than in much of Tamil Nadu, based on the latest published snapshot.",
        summary:
          "Coimbatore has 1,32,904 cases waiting. A typical pending case falls around 730 days old, and the district cleared 107.8% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "madurai",
        districtName: "Madurai",
        rank: 3,
        backlogCases: 118772,
        disposalRate: 79.5,
        medianAgeDays: 365,
        filingVsDisposalGap: 20.5,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Madurai has 1,18,772 cases waiting. A typical pending case falls around 365 days old, and the district cleared 79.5% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 1746162,
        disposalRate: 101.6,
      },
    ],
  };
}

export function buildKeralaTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "KL",
      stateName: "Kerala",
      sourceName: "NJDG Kerala district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T02:15:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Kerala",
      publishedFromRunId: "run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3",
    },
    stats: {
      pendingCases: 1801417,
      disposalRate: 134.9,
      medianCaseAgeDays: 365,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "ernakulam",
        districtName: "Ernakulam",
        rank: 1,
        backlogCases: 268114,
        disposalRate: 91.7,
        medianAgeDays: 365,
        filingVsDisposalGap: 8.3,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Kerala's biggest.",
        summary:
          "Ernakulam has 2,68,114 cases waiting. A typical pending case falls around 365 days old, and the district cleared 91.7% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "kozhikode",
        districtName: "Kozhikode",
        rank: 2,
        backlogCases: 187442,
        disposalRate: 111.6,
        medianAgeDays: 730,
        filingVsDisposalGap: -11.6,
        flagReason:
          "People appear to be waiting longer here than in much of Kerala, based on the latest published snapshot.",
        summary:
          "Kozhikode has 1,87,442 cases waiting. A typical pending case falls around 730 days old, and the district cleared 111.6% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "kasaragod",
        districtName: "Kasaragod",
        rank: 3,
        backlogCases: 92481,
        disposalRate: 83.4,
        medianAgeDays: 183,
        filingVsDisposalGap: 16.6,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Kasaragod has 92,481 cases waiting. A typical pending case falls around 183 days old, and the district cleared 83.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 1801417,
        disposalRate: 134.9,
      },
    ],
  };
}

export function buildMeghalayaTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "ML",
      stateName: "Meghalaya",
      sourceName: "NJDG Meghalaya district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T04:30:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Meghalaya",
      publishedFromRunId: "run_3dd14fff-0791-45b4-9bd7-27ce798cc850",
    },
    stats: {
      pendingCases: 18450,
      disposalRate: 53.4,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "east-khasi-hills",
        districtName: "East Khasi Hills",
        rank: 1,
        backlogCases: 6214,
        disposalRate: 47.8,
        medianAgeDays: 183,
        filingVsDisposalGap: 52.2,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Meghalaya's biggest.",
        summary:
          "East Khasi Hills has 6,214 cases waiting. A typical pending case falls around 183 days old, and the district cleared 47.8% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "west-garo-hills",
        districtName: "West Garo Hills",
        rank: 2,
        backlogCases: 4217,
        disposalRate: 61.2,
        medianAgeDays: 730,
        filingVsDisposalGap: 38.8,
        flagReason:
          "People appear to be waiting longer here than in much of Meghalaya, based on the latest published snapshot.",
        summary:
          "West Garo Hills has 4,217 cases waiting. A typical pending case falls around 730 days old, and the district cleared 61.2% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "west-jaintia-hills",
        districtName: "West Jaintia Hills",
        rank: 3,
        backlogCases: 2984,
        disposalRate: 58.7,
        medianAgeDays: 365,
        filingVsDisposalGap: 41.3,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "West Jaintia Hills has 2,984 cases waiting. A typical pending case falls around 365 days old, and the district cleared 58.7% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 18450,
        disposalRate: 53.4,
      },
    ],
  };
}

export function buildKarnatakaTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "KA",
      stateName: "Karnataka",
      sourceName: "NJDG Karnataka district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T05:10:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Karnataka",
      publishedFromRunId: "run_c57e88aa-c6bf-40d8-a3fb-9343bd819174",
    },
    stats: {
      pendingCases: 2230354,
      disposalRate: 144.5,
      medianCaseAgeDays: 365,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "belagavi",
        districtName: "Belagavi",
        rank: 1,
        backlogCases: 184320,
        disposalRate: 91.8,
        medianAgeDays: 365,
        filingVsDisposalGap: 8.2,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Karnataka's biggest.",
        summary:
          "Belagavi has 1,84,320 cases waiting. A typical pending case falls around 365 days old, and the district cleared 91.8% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "bagalkot",
        districtName: "Bagalkot",
        rank: 2,
        backlogCases: 117408,
        disposalRate: 152.4,
        medianAgeDays: 730,
        filingVsDisposalGap: -52.4,
        flagReason:
          "People appear to be waiting longer here than in much of Karnataka, based on the latest published snapshot.",
        summary:
          "Bagalkot has 1,17,408 cases waiting. A typical pending case falls around 730 days old, and the district cleared 152.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "vijayapura",
        districtName: "Vijayapura",
        rank: 3,
        backlogCases: 103226,
        disposalRate: 88.1,
        medianAgeDays: 365,
        filingVsDisposalGap: 11.9,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Vijayapura has 1,03,226 cases waiting. A typical pending case falls around 365 days old, and the district cleared 88.1% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 2230354,
        disposalRate: 144.5,
      },
    ],
  };
}

export function buildTripuraTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "TR",
      stateName: "Tripura",
      sourceName: "NJDG Tripura district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T05:20:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Tripura",
      publishedFromRunId: "run_6b5e6751-0835-42b1-a89a-f3da080f5287",
    },
    stats: {
      pendingCases: 63981,
      disposalRate: 146.9,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "west-tripura",
        districtName: "West Tripura",
        rank: 1,
        backlogCases: 18214,
        disposalRate: 91.6,
        medianAgeDays: 183,
        filingVsDisposalGap: 8.4,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Tripura's biggest.",
        summary:
          "West Tripura has 18,214 cases waiting. A typical pending case falls around 183 days old, and the district cleared 91.6% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "north-tripura",
        districtName: "North Tripura",
        rank: 2,
        backlogCases: 9732,
        disposalRate: 168.4,
        medianAgeDays: 730,
        filingVsDisposalGap: -68.4,
        flagReason:
          "People appear to be waiting longer here than in much of Tripura, based on the latest published snapshot.",
        summary:
          "North Tripura has 9,732 cases waiting. A typical pending case falls around 730 days old, and the district cleared 168.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "south-tripura",
        districtName: "South Tripura",
        rank: 3,
        backlogCases: 8651,
        disposalRate: 102.7,
        medianAgeDays: 365,
        filingVsDisposalGap: -2.7,
        flagReason:
          "This district still carries a visible backlog in the statewide snapshot even after clearing slightly more cases than it received last month.",
        summary:
          "South Tripura has 8,651 cases waiting. A typical pending case falls around 365 days old, and the district cleared 102.7% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 63981,
        disposalRate: 146.9,
      },
    ],
  };
}

export function buildNagalandTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "NL",
      stateName: "Nagaland",
      sourceName: "NJDG Nagaland district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T05:30:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Nagaland",
      publishedFromRunId: "run_8abb0436-80c5-4ce3-92c7-cf6049c55010",
    },
    stats: {
      pendingCases: 3984,
      disposalRate: 108.6,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "dimapur",
        districtName: "Dimapur",
        rank: 1,
        backlogCases: 1432,
        disposalRate: 94.2,
        medianAgeDays: 183,
        filingVsDisposalGap: 5.8,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Nagaland's biggest.",
        summary:
          "Dimapur has 1,432 cases waiting. A typical pending case falls around 183 days old, and the district cleared 94.2% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "kohima",
        districtName: "Kohima",
        rank: 2,
        backlogCases: 1108,
        disposalRate: 117.1,
        medianAgeDays: 365,
        filingVsDisposalGap: -17.1,
        flagReason:
          "People appear to be waiting longer here than in much of Nagaland, based on the latest published snapshot.",
        summary:
          "Kohima has 1,108 cases waiting. A typical pending case falls around 365 days old, and the district cleared 117.1% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "mokokchung",
        districtName: "Mokokchung",
        rank: 3,
        backlogCases: 524,
        disposalRate: 88.9,
        medianAgeDays: 183,
        filingVsDisposalGap: 11.1,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Mokokchung has 524 cases waiting. A typical pending case falls around 183 days old, and the district cleared 88.9% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 3984,
        disposalRate: 108.6,
      },
    ],
  };
}
