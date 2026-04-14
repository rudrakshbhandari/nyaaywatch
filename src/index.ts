import { Pool } from "pg";

import { createApp } from "./api/app.js";
import { loadConfig } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { NjdgHimachalSourceClient } from "./ingest/himachal-source-client.js";
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
  console.log(`NyaayWatch listening on http://localhost:${config.PORT}`);
});

process.on("SIGTERM", async () => {
  server.close();
  await pool.end();
});
