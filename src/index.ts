import { Pool } from "pg";

import { createApp } from "./api/app.js";
import { loadConfig } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { NjdgHimachalSourceClient } from "./ingest/himachal-source-client.js";
import { logError, logInfo } from "./lib/logger.js";
import { PublishedSnapshotService } from "./services/published-snapshot-service.js";
import { S3ArtifactStore } from "./storage/artifact-store.js";
import { PgWarehouseStore } from "./storage/postgres.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.DATABASE_URL });

await runMigrations(pool);

const store = PgWarehouseStore.fromPool(pool);
const artifactStore = new S3ArtifactStore(config);
const sourceClient = new NjdgHimachalSourceClient();
const service = new PublishedSnapshotService(config, store, artifactStore, sourceClient);
const app = createApp(config, service);

const server = app.listen(config.PORT, () => {
  logInfo("server_started", {
    port: config.PORT,
    deployEnv: config.DEPLOY_ENV,
    awsRegion: config.AWS_REGION,
    stateCode: config.STATE_CODE,
  });
});

process.on("SIGTERM", async () => {
  logInfo("server_shutdown_requested", { signal: "SIGTERM" });
  server.close();
  await pool.end();
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
