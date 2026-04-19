import { afterEach, describe, expect, it } from "vitest";

import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import type { AppConfig } from "../src/config/env.js";
import { loadConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { getHighCourtProfile } from "../src/high-courts.js";
import type { HighCourtCaptureBundle } from "../src/domain/high-court-capture-schema.js";
import type { HighCourtSourceClient } from "../src/ingest/high-court-source-client.js";
import { PublishedHighCourtSnapshotService } from "../src/services/published-high-court-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";
import { buildHimachalHighCourtCaptureBundle } from "./fixtures/high-court.js";

describe("PublishedHighCourtSnapshotService", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("captures a High Court run, stores a candidate, and publishes it with the explicit captured_at fallback", async () => {
    const context = await createHighCourtTestContext();
    pools.push(context.pool);

    const captured = await context.service.captureRun("High Court fixture capture");
    const statsBeforePublish = await context.service.getStats();

    expect(captured.run.status).toBe("completed");
    expect(captured.run.stateCode).toBe("HPHC");
    expect(captured.run.sourceSnapshotAt).toBe("2026-04-19T00:00:00.000Z");
    expect(captured.candidate?.snapshot.sourceSnapshotAt).toBeNull();
    expect(captured.candidate?.snapshot.referenceDateKind).toBe("captured_at");
    expect(captured.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-high-court-html-bundle",
      "high-court-snapshot-candidate-json",
    ]);
    expect(statsBeforePublish).toBeNull();

    const published = await context.service.publishRun(captured.run.id, "High Court fixture publish");
    const stats = await context.service.getStats();
    const trends = await context.service.getTrends();

    expect(published.run.status).toBe("published");
    expect(stats?.snapshot.referenceDateKind).toBe("captured_at");
    expect(stats?.snapshot.sourceSnapshotAt).toBeNull();
    expect(stats?.stats.pendingTotalCases).toBe(105599);
    expect(trends?.trends).toHaveLength(1);
  });

  it("replays a published High Court run from stored evidence and supports rollback", async () => {
    const context = await createHighCourtTestContext();
    pools.push(context.pool);

    const captured = await context.service.captureRun("Initial High Court capture");
    const seeded = await context.service.publishRun(captured.run.id, "Initial High Court publish");
    const replayed = await context.service.replayRun(seeded.run.id, "High Court replay");
    const replayInspection = await context.service.inspectRun(replayed.run.id);
    const publicationsAfterReplay = await context.service.listPublications();

    expect(replayed.run.replayOfRunId).toBe(seeded.run.id);
    expect(replayed.run.status).toBe("replayed");
    expect(replayInspection?.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-high-court-html-bundle",
      "high-court-snapshot-candidate-json",
    ]);
    expect(publicationsAfterReplay).toHaveLength(2);
    expect(publicationsAfterReplay[0]?.publishedSnapshotId).toBe(replayed.snapshot.id);

    const rollback = await context.service.rollbackPublication(seeded.publication.id, "High Court rollback");
    const publicationsAfterRollback = await context.service.listPublications();
    const activeSnapshot = await context.service.getPublishedSnapshot();

    expect(rollback.action).toBe("rollback");
    expect(publicationsAfterRollback).toHaveLength(3);
    expect(activeSnapshot?.id).toBe(seeded.snapshot.id);

    const history = await context.service.listPublicationHistory();
    expect(history[0]?.publication.id).toBe(rollback.id);
    expect(history[0]?.isActive).toBe(true);
    expect(history[0]?.snapshot.id).toBe(seeded.snapshot.id);
    expect(history[1]?.publication.id).toBe(replayed.publication.id);
  });
});

async function createHighCourtTestContext() {
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
  const service = new PublishedHighCourtSnapshotService(
    config,
    getHighCourtProfile("HPHC"),
    store,
    artifactStore,
    new StaticHighCourtSourceClient(buildHimachalHighCourtCaptureBundle()),
  );

  return { pool, config, service };
}

class StaticHighCourtSourceClient implements HighCourtSourceClient {
  constructor(private readonly bundle: HighCourtCaptureBundle) {}

  async captureLatest(): Promise<HighCourtCaptureBundle> {
    return structuredClone(this.bundle);
  }
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
