import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { createFixtureSourceClient } from "./fixtures.js";
import { getStateProfile } from "../geographies.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const profile = getStateProfile(config.STATE_CODE);
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const sourceClient = createFixtureSourceClient(config.STATE_CODE);
    const service = new PublishedSnapshotService(config, profile, store, artifactStore, sourceClient);
    const captured = await service.captureRun("Manual fixture capture.");
    const result = await service.publishRun(captured.run.id, "Manual fixture publish.");

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

await main();
