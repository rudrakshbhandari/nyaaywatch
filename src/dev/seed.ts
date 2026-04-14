import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { loadSeedFixture } from "./fixtures.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const service = new PublishedSnapshotService(config, store, artifactStore);
    const fixture = await loadSeedFixture();
    const result = await service.seedPublishedSnapshot({
      ...fixture,
      note: "Manual seed publish.",
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

await main();
