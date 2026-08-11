import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import { createApp } from "../src/api/app.js";
import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createFixtureSourceClient } from "../src/dev/fixtures.js";
import { getStateProfile } from "../src/geographies.js";
import { FixtureParliamentarySourceClient } from "../src/ingest/parliamentary-source-client.js";
import { PublishedParliamentarySnapshotService } from "../src/services/published-parliamentary-snapshot-service.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";

describe("internal parliamentary HTML and JSON surfaces", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("requires the operator token and renders the same published values in JSON and HTML", async () => {
    const context = await createSurfaceContext();
    pools.push(context.pool);

    const unauthorized = await request(context.app).get("/operator/parliamentary");
    expect(unauthorized.status).toBe(401);

    const jsonResponse = await request(context.app)
      .get("/operator/parliamentary")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);
    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse.body.snapshot.metadata.scopeId).toBe("ls-18-session-5");
    expect(jsonResponse.body.snapshot.metadata.lineageId).toBe("parliament-ls18-s5-20260811T033035Z");
    expect(jsonResponse.body.aggregate.activity.bills.uniqueBillCount).toBe(14);
    expect(jsonResponse.body.aggregate.activity.questions.sourceReportedCount).toBe(125);
    expect(jsonResponse.body.aggregate.activity.questions.sessionScopedCount).toBe(20);
    expect(jsonResponse.body.methodology.publicationBoundary).toContain("Internal operator surfaces only");
    expect(jsonResponse.body.citations.some((citation: { url: string }) => citation.url.includes("sansad.in"))).toBe(true);

    const htmlResponse = await request(context.app)
      .get("/operator/parliamentary/html")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);
    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.text).toContain('data-lineage-id="parliament-ls18-s5-20260811T033035Z"');
    expect(htmlResponse.text).toContain("Unique bills");
    expect(htmlResponse.text).toContain(">14</dd>");
    expect(htmlResponse.text).toContain("Questions reported by source");
    expect(htmlResponse.text).toContain(">125</dd>");
    expect(htmlResponse.text).toContain(">20</dd>");
    expect(htmlResponse.text).toContain("https://sansad.in/api_ls/member/5814?locale=en");

    const profileResponse = await request(context.app)
      .get("/operator/parliamentary/html/mp/mp-5814")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.text).toContain("Shri Mani A");
    expect(profileResponse.text).toContain("Dharmapuri");
    expect(profileResponse.text).toContain("Dravida Munnetra Kazhagam");
    expect(profileResponse.text).toContain(">125</dd>");

    expect((await request(context.app).get("/parliamentary")).status).toBe(404);
  });
});

async function createSurfaceContext() {
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
  const lowerCourtService = new PublishedSnapshotService(
    config,
    getStateProfile("HP"),
    store,
    artifactStore,
    createFixtureSourceClient("HP"),
  );
  const parliamentaryService = new PublishedParliamentarySnapshotService(
    config,
    store,
    artifactStore,
    new FixtureParliamentarySourceClient("fixtures/parliament"),
  );
  const captured = await parliamentaryService.captureRun("Surface fixture capture");
  await parliamentaryService.publishRun(captured.run.id, "Surface fixture publish");
  const app = createApp(config, lowerCourtService, {}, {}, undefined, pool, parliamentaryService);
  return { app, config, pool };
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
    ENABLE_OPERATOR_ROUTES: "true",
    STATE_CODE: "HP",
  });
}
