import { DataType, newDb } from "pg-mem";
import { type Pool } from "pg";

import { loadConfig, type AppConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { loadSeedFixture } from "../src/dev/fixtures.js";
import { createApp } from "../src/api/app.js";
import { PublishedSnapshotService } from "../src/services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../src/storage/artifact-store.js";
import { PgWarehouseStore } from "../src/storage/postgres.js";

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
  const service = new PublishedSnapshotService(config, store, artifactStore);

  return { pool, config, service };
}

export async function seedTestSnapshot(service: PublishedSnapshotService) {
  const fixture = await loadSeedFixture();
  return service.seedPublishedSnapshot({
    ...fixture,
    note: "Test seed publish.",
  });
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
  });
}
