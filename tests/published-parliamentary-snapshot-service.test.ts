import { afterEach, describe, expect, it } from "vitest";
import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import type { ParliamentaryCaptureBundle } from "../src/domain/parliamentary-schema.js";
import type { ParliamentarySourceClient } from "../src/ingest/parliamentary-source-client.js";
import { PublishedParliamentarySnapshotService } from "../src/services/published-parliamentary-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";
import { FixtureParliamentarySourceClient } from "../src/ingest/parliamentary-source-client.js";

describe("PublishedParliamentarySnapshotService", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("captures and publishes a partial internal snapshot without relabeling its scope", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const captured = await context.service.captureRun("Parliament fixture capture");
    expect(captured.run.status).toBe("completed");
    expect(captured.run.scopeType).toBe("parliamentary");
    expect(captured.run.scopeCode).toBe("ls-18-session-5");
    expect(captured.run.stateCode).toBe("PARLIAMENT");
    expect(captured.run.qualityState).toBe("partial");
    expect(captured.candidate?.metadata.lineageId).toBe("parliament-ls18-s5-20260811T033035Z");
    expect(captured.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "parliamentary-capture-fixture-json",
      "parliamentary-snapshot-candidate-json",
    ]);

    const published = await context.service.publishRun(captured.run.id, "Parliament fixture publish");
    expect(published.run.status).toBe("published");
    expect(published.snapshot.payload.metadata.lineageId).toBe(captured.candidate?.metadata.lineageId);
    expect(published.snapshot.payload.aggregate.activity.questions.sessionScopedCount).toBe(20);
    expect(published.snapshot.payload.aggregate.activity.questions.sourceReportedCount).toBe(125);
    expect(published.snapshot.payload.aggregate.activity.questions.sourceReportedScope).toBe("lok_sabha");
    expect((await context.service.getPublishedSnapshot())?.id).toBe(published.snapshot.id);
  });

  it("replays the captured artifact and rolls publication history back", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const captured = await context.service.captureRun("Initial parliamentary capture");
    const published = await context.service.publishRun(captured.run.id, "Initial parliamentary publish");
    const replayed = await context.service.replayRun(published.run.id, "Parliament replay");
    const replayInspection = await context.service.inspectRun(replayed.run.id);

    expect(replayed.run.replayOfRunId).toBe(published.run.id);
    expect(replayed.run.status).toBe("replayed");
    expect(replayInspection?.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "parliamentary-capture-fixture-json",
      "parliamentary-snapshot-candidate-json",
    ]);
    expect(replayed.snapshot.payload.metadata.lineageId).toBe(published.snapshot.payload.metadata.lineageId);
    expect(replayed.snapshot.payload.aggregate).toEqual(published.snapshot.payload.aggregate);

    const rollback = await context.service.rollbackPublication(published.publication.id, "Parliament rollback");
    expect(rollback.action).toBe("rollback");
    expect((await context.service.getPublishedSnapshot())?.id).toBe(published.snapshot.id);

    const history = await context.service.listPublicationHistory();
    expect(history).toHaveLength(3);
    expect(history[0]?.isActive).toBe(true);
    expect(history[0]?.publication.id).toBe(rollback.id);
    expect(history[1]?.publication.id).toBe(replayed.publication.id);
  });
});

async function createTestContext() {
  const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "pg-mem",
  });

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Pool;
  await runMigrations(pool);
  const store = PgWarehouseStore.fromPool(pool);
  const artifactStore = new InMemoryArtifactStore();
  const service = new PublishedParliamentarySnapshotService(
    createTestConfig(),
    store,
    artifactStore,
    new StaticParliamentarySourceClient(
      await new FixtureParliamentarySourceClient("fixtures/parliament").capture(),
    ),
  );

  return { pool, service };
}

class StaticParliamentarySourceClient implements ParliamentarySourceClient {
  constructor(private readonly bundle: ParliamentaryCaptureBundle) {}

  async capture(): Promise<ParliamentaryCaptureBundle> {
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
  });
}
