import { DataType, newDb } from "pg-mem";
import type { Pool } from "pg";
import { randomUUID } from "node:crypto";

import { createApp } from "../api/app.js";
import { loadConfig, type AppConfig } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import { createFixtureSourceClient } from "../dev/fixtures.js";
import { buildPreviewSupremeCourtCaptureBundle } from "../dev/supreme-court-fixture.js";
import { getStateProfile, listStateProfiles, type SupportedStateCode } from "../geographies.js";
import { listHighCourtProfiles, type SupportedHighCourtCode } from "../high-courts.js";
import { createHighCourtSourceClient } from "../ingest/high-court-source-client.js";
import type { SupremeCourtCaptureBundle } from "../domain/supreme-court-capture-schema.js";
import type { SupremeCourtSourceClient } from "../ingest/supreme-court-source-client.js";
import { PublishedHighCourtSnapshotService } from "../services/published-high-court-snapshot-service.js";
import { PublishedSupremeCourtSnapshotService } from "../services/published-supreme-court-snapshot-service.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { InMemoryArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";
import { getSupremeCourtProfile } from "../supreme-court.js";

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
    OPERATOR_API_TOKEN: rawEnv.OPERATOR_API_TOKEN ?? `preview-disabled-${randomUUID()}`,
    ENABLE_OPERATOR_ROUTES: rawEnv.ENABLE_OPERATOR_ROUTES ?? "false",
    STATE_CODE: rawEnv.STATE_CODE ?? "HP",
  });
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
        createHighCourtSourceClient(highCourtProfile.courtCode),
      ),
    ]),
  ) as Partial<Record<SupportedHighCourtCode, PublishedHighCourtSnapshotService>>;
  const supremeCourtService = new PublishedSupremeCourtSnapshotService(
    config,
    getSupremeCourtProfile(),
    store,
    artifactStore,
    createPreviewSupremeCourtSourceClient(),
  );
  const existing = await service.getPublishedSnapshot();
  const existingSupremeCourt = await supremeCourtService.getPublishedSnapshot();

  if (!existing) {
    const captured = await service.captureRun("Preview fixture capture.");
    await service.publishRun(captured.run.id, "Preview published snapshot.");
  }

  if (!existingSupremeCourt) {
    const captured = await supremeCourtService.captureRun("Preview Supreme Court fixture capture.");
    await supremeCourtService.publishRun(captured.run.id, "Preview Supreme Court published snapshot.");
  }

  return {
    app: createApp(config, service, publicServices, highCourtServices, supremeCourtService),
    config,
    async close() {
      await pool.end();
    },
  };
}

function createPreviewSupremeCourtSourceClient(): SupremeCourtSourceClient {
  return {
    async captureLatest(): Promise<SupremeCourtCaptureBundle> {
      return buildPreviewSupremeCourtCaptureBundle();
    },
  };
}
