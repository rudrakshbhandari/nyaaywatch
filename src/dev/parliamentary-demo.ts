import request from "supertest";
import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import { createApp } from "../api/app.js";
import { loadConfig, type AppConfig } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import { createFixtureSourceClient } from "./fixtures.js";
import { getStateProfile } from "../geographies.js";
import { FixtureParliamentarySourceClient } from "../ingest/parliamentary-source-client.js";
import { PublishedParliamentarySnapshotService } from "../services/published-parliamentary-snapshot-service.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
db.public.registerFunction({
  name: "version",
  returns: DataType.text,
  implementation: () => "pg-mem",
});

const adapter = db.adapters.createPg();
const pool = new adapter.Pool() as Pool;

try {
  await runMigrations(pool);
  const config = createDemoConfig();
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
  const app = createApp(config, lowerCourtService, {}, {}, undefined, pool, parliamentaryService);

  const captured = await parliamentaryService.captureRun("Local parliamentary demo capture");
  const published = await parliamentaryService.publishRun(captured.run.id, "Local parliamentary demo publish");
  const replayed = await parliamentaryService.replayRun(published.run.id, "Local parliamentary demo replay");
  const rollback = await parliamentaryService.rollbackPublication(published.publication.id, "Local parliamentary demo rollback");
  const jsonResponse = await request(app)
    .get("/operator/parliamentary")
    .set("x-operator-token", config.OPERATOR_API_TOKEN);
  const htmlResponse = await request(app)
    .get("/operator/parliamentary/html")
    .set("x-operator-token", config.OPERATOR_API_TOKEN);
  const profileResponse = await request(app)
    .get("/operator/parliamentary/html/mp/mp-5814")
    .set("x-operator-token", config.OPERATOR_API_TOKEN);

  if (jsonResponse.status !== 200 || htmlResponse.status !== 200 || profileResponse.status !== 200) {
    throw new Error(`Surface demo failed: JSON ${jsonResponse.status}, HTML ${htmlResponse.status}, profile ${profileResponse.status}.`);
  }

  const snapshot = published.snapshot.payload;
  console.log(
    JSON.stringify(
      {
        scope: snapshot.metadata.scopeId,
        capturedRunId: captured.run.id,
        publishedRunId: published.run.id,
        publishedPublicationId: published.publication.id,
        replayRunId: replayed.run.id,
        replayPublicationId: replayed.publication.id,
        rollbackPublicationId: rollback.id,
        statuses: {
          captured: captured.run.status,
          published: published.run.status,
          replayed: replayed.run.status,
          rollback: rollback.action,
        },
        lineage: {
          aggregate: snapshot.metadata.lineageId,
          profile: snapshot.profiles[0]?.person.personId ? snapshot.metadata.lineageId : null,
          replay: replayed.snapshot.payload.metadata.lineageId,
          allMatch: snapshot.metadata.lineageId === replayed.snapshot.payload.metadata.lineageId,
        },
        publishedValues: {
          uniqueBillCount: snapshot.aggregate.activity.bills.uniqueBillCount,
          sourceReportedQuestionCount: snapshot.aggregate.activity.questions.sourceReportedCount,
          sessionScopedQuestionCount: snapshot.aggregate.activity.questions.sessionScopedCount,
          mpProfile: snapshot.profiles[0]?.person.fullName,
        },
        surfaces: {
          jsonStatus: jsonResponse.status,
          htmlStatus: htmlResponse.status,
          profileHtmlStatus: profileResponse.status,
          htmlContainsLineage: htmlResponse.text.includes(snapshot.metadata.lineageId),
          htmlContainsUniqueBillCount: htmlResponse.text.includes(String(snapshot.aggregate.activity.bills.uniqueBillCount)),
          profileHtmlContainsName: profileResponse.text.includes(snapshot.profiles[0]?.person.fullName ?? ""),
        },
        qualityState: snapshot.metadata.qualityState,
        remainingMissingData: snapshot.aggregate.missingData,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}

function createDemoConfig(): AppConfig {
  return loadConfig({
    NODE_ENV: "test",
    PORT: "3000",
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch-demo",
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "demo",
    AWS_SECRET_ACCESS_KEY: "demo",
    S3_BUCKET: "nyaaywatch-demo-artifacts",
    DEPLOY_ENV: "dev",
    OPERATOR_API_TOKEN: "operator-demo-token",
    ENABLE_OPERATOR_ROUTES: "true",
    STATE_CODE: "HP",
  });
}
