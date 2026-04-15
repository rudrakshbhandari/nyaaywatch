import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";

import { createApp } from "../api/app.js";
import { loadConfig, type AppConfig } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import { createFixtureSourceClient } from "../dev/fixtures.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

export interface AppRuntime {
  app: ReturnType<typeof createApp>;
  config: AppConfig;
  close(): Promise<void>;
}

export async function createPreviewRuntime(rawEnv: NodeJS.ProcessEnv = process.env): Promise<AppRuntime> {
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
    ...rawEnv,
    NODE_ENV: rawEnv.NODE_ENV ?? "production",
    DATABASE_URL: rawEnv.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/nyaaywatch-preview",
    AWS_REGION: rawEnv.AWS_REGION ?? "ap-south-1",
    S3_BUCKET: rawEnv.S3_BUCKET ?? "nyaaywatch-preview-artifacts",
    DEPLOY_ENV: rawEnv.DEPLOY_ENV ?? "dev",
    OPERATOR_API_TOKEN: rawEnv.OPERATOR_API_TOKEN ?? "preview-operator-token",
    STATE_CODE: rawEnv.STATE_CODE ?? "HP",
  });

  const store = PgWarehouseStore.fromPool(pool);
  const artifactStore = new InMemoryArtifactStore();
  const sourceClient = createFixtureSourceClient();
  const service = new PublishedSnapshotService(config, store, artifactStore, sourceClient);
  const existing = await service.getPublishedSnapshot();

  if (!existing) {
    const captured = await service.captureRun("Preview fixture capture.");
    await service.publishRun(captured.run.id, "Preview published snapshot.");
  }

  return {
    app: createApp(config, service),
    config,
    async close() {
      await pool.end();
    },
  };
}
