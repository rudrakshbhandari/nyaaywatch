import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { loadConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createFixtureSourceClient } from "../src/dev/fixtures.js";
import { getStateProfile } from "../src/geographies.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { S3ArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";

const describePersistent = process.env.RUN_PERSISTENT_STACK_TESTS === "1" ? describe : describe.skip;

describePersistent("persistent Postgres + S3 integration", () => {
  let adminPool: Pool;
  let testPool: Pool;
  let service: PublishedSnapshotService;
  let databaseName: string;

  beforeAll(async () => {
    const baseConfig = loadConfig({
      NODE_ENV: "test",
      PORT: process.env.PORT ?? "3000",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/postgres",
      AWS_REGION: process.env.AWS_REGION ?? "ap-south-1",
      AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3 ?? "http://127.0.0.1:4566",
      AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE ?? "true",
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      S3_BUCKET: `nyaaywatch-persistent-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      DEPLOY_ENV: "dev",
      OPERATOR_API_TOKEN: process.env.OPERATOR_API_TOKEN ?? "operator-test-token",
      STATE_CODE: "HP",
    });

    const adminUrl = new URL(baseConfig.DATABASE_URL);
    databaseName = `nyaaywatch_it_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    adminUrl.pathname = "/postgres";
    adminPool = new Pool({ connectionString: adminUrl.toString() });
    await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);

    const databaseUrl = new URL(baseConfig.DATABASE_URL);
    databaseUrl.pathname = `/${databaseName}`;
    testPool = new Pool({ connectionString: databaseUrl.toString() });
    await runMigrations(testPool);
    const config = { ...baseConfig, DATABASE_URL: databaseUrl.toString() };

    service = new PublishedSnapshotService(
      config,
      getStateProfile(config.STATE_CODE),
      PgWarehouseStore.fromPool(testPool),
      new S3ArtifactStore(baseConfig),
      createFixtureSourceClient(config.STATE_CODE),
    );
  }, 90_000);

  afterAll(async () => {
    await testPool?.end();
    if (adminPool) {
      await adminPool.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [databaseName],
      );
      await adminPool.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
      await adminPool.end();
    }
  });

  it("persists fetch, publish, replay, and rollback through the local dev stack", async () => {
    const captured = await service.captureRun("Persistent integration fetch");
    const inspectedCapture = await service.inspectRun(captured.run.id);

    expect(captured.run.status).toBe("completed");
    expect(inspectedCapture?.candidate?.stats.pendingCases).toBe(617086);
    expect(inspectedCapture?.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-njdg-html-bundle",
      "snapshot-candidate-json",
    ]);

    const published = await service.publishRun(captured.run.id, "Persistent integration publish");
    const latestAfterPublish = await service.getPublishedSnapshot();

    expect(published.run.status).toBe("published");
    expect(latestAfterPublish?.id).toBe(published.snapshot.id);

    const replayed = await service.replayRun(captured.run.id, "Persistent integration replay");
    const inspectedReplay = await service.inspectRun(replayed.run.id);
    const publicationsAfterReplay = await service.listPublications();

    expect(replayed.run.status).toBe("replayed");
    expect(replayed.run.replayOfRunId).toBe(captured.run.id);
    expect(inspectedReplay?.candidate?.stats.pendingCases).toBe(617086);
    expect(inspectedReplay?.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-njdg-html-bundle",
      "snapshot-candidate-json",
    ]);
    expect(publicationsAfterReplay[0]?.publishedSnapshotId).toBe(replayed.snapshot.id);

    const rollback = await service.rollbackPublication(published.publication.id, "Persistent integration rollback");
    const latestAfterRollback = await service.getPublishedSnapshot();

    expect(rollback.action).toBe("rollback");
    expect(latestAfterRollback?.id).toBe(published.snapshot.id);
  }, 90_000);
});

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}
