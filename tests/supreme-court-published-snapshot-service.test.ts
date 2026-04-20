import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env.js";
import type { SupremeCourtCaptureBundle } from "../src/domain/supreme-court-capture-schema.js";
import type { SupremeCourtSourceClient } from "../src/ingest/supreme-court-source-client.js";
import { getSupremeCourtProfile } from "../src/supreme-court.js";
import { PublishedSupremeCourtSnapshotService } from "../src/services/published-supreme-court-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";
import { runMigrations } from "../src/db/migrate.js";
import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";
import { buildSupremeCourtCaptureBundle } from "./fixtures/supreme-court.js";

describe("PublishedSupremeCourtSnapshotService", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("captures and publishes a Supreme Court snapshot candidate through the internal lifecycle", async () => {
    const context = await createSupremeCourtTestContext();
    pools.push(context.pool);

    const capture = await context.service.captureRun("Test Supreme Court capture.");
    expect(capture.run.scopeType).toBe("supreme_court");
    expect(capture.run.scopeCode).toBe("SCI");
    expect(capture.run.stateCode).toBe("SCI");
    expect(capture.candidate?.snapshot.courtTier).toBe("supreme_court");
    expect(capture.candidate?.snapshot.referenceDateKind).toBe("captured_at");

    const published = await context.service.publishRun(capture.run.id, "Test Supreme Court publish.");
    expect(published.run.status).toBe("published");
    expect((published.snapshot.payload as any).snapshot.courtCode).toBe("SCI");

    const replayed = await context.service.replayRun(published.run.id, "Test Supreme Court replay.");
    expect(replayed.run.status).toBe("replayed");
    expect(replayed.run.replayOfRunId).toBe(published.run.id);
    expect((replayed.snapshot.payload as any).snapshot.replayedFromRunId).toBe(published.run.id);

    const history = await context.service.listPublicationHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.run.replayOfRunId).toBe(published.run.id);
    expect(history[0]?.stats.pendingTotalCases).toBe(92245);
  });
});

async function createSupremeCourtTestContext() {
  const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "pg-mem",
  });

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Pool;
  await runMigrations(pool);

  const config = loadConfig({
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

  return {
    pool,
    service: new PublishedSupremeCourtSnapshotService(
      config,
      getSupremeCourtProfile(),
      PgWarehouseStore.fromPool(pool),
      new InMemoryArtifactStore(),
      new StaticSupremeCourtSourceClient(buildSupremeCourtCaptureBundle()),
    ),
  };
}

class StaticSupremeCourtSourceClient implements SupremeCourtSourceClient {
  constructor(private readonly bundle: SupremeCourtCaptureBundle) {}

  async captureLatest(): Promise<SupremeCourtCaptureBundle> {
    return this.bundle;
  }
}
