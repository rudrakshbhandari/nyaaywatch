import { createApp } from "./api/app.js";
import { loadConfig, type AppConfig } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { getStateProfile, listStateProfiles, type SupportedStateCode } from "./geographies.js";
import { listHighCourtProfiles, type SupportedHighCourtCode } from "./high-courts.js";
import { NjdgStateSourceClient } from "./ingest/himachal-source-client.js";
import { createHighCourtSourceClient } from "./ingest/high-court-source-client.js";
import { createSupremeCourtSourceClient } from "./ingest/supreme-court-source-client.js";
import { logError, logInfo } from "./lib/logger.js";
import { createPreviewRuntime, type AppRuntime } from "./preview/runtime.js";
import { PublishedHighCourtSnapshotService } from "./services/published-high-court-snapshot-service.js";
import { PublishedSupremeCourtSnapshotService } from "./services/published-supreme-court-snapshot-service.js";
import { PublishedSnapshotService } from "./services/published-snapshot-service.js";
import { S3ArtifactStore } from "./storage/artifact-store.js";
import { PgWarehouseStore } from "./storage/postgres.js";
import { getSupremeCourtProfile } from "./supreme-court.js";
import { Pool } from "pg";

const runtime = process.env.APP_MODE === "preview" ? await createPreviewRuntime() : await createRuntime();
const server = runtime.app.listen(runtime.config.PORT, () => {
  logInfo("server_started", {
    port: runtime.config.PORT,
    deployEnv: runtime.config.DEPLOY_ENV,
    awsRegion: runtime.config.AWS_REGION,
    stateCode: runtime.config.STATE_CODE,
    appMode: process.env.APP_MODE ?? "default",
  });
});

process.on("SIGTERM", async () => {
  logInfo("server_shutdown_requested", { signal: "SIGTERM" });
  server.close();
  await runtime.close();
});

process.on("uncaughtException", (error) => {
  logError("uncaught_exception", {
    message: error.message,
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason) => {
  logError("unhandled_rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

async function createRuntime(): Promise<AppRuntime> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const profile = getStateProfile(config.STATE_CODE);

  await runMigrations(pool);

  const store = PgWarehouseStore.fromPool(pool);
  const artifactStore = new S3ArtifactStore(config);
  const sourceClient = new NjdgStateSourceClient(profile);
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
              new NjdgStateSourceClient(publicProfile),
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
    createSupremeCourtSourceClient(),
  );

  return {
    app: createApp(config, service, publicServices, highCourtServices, supremeCourtService, pool),
    config,
    async close() {
      await pool.end();
    },
  };
}
