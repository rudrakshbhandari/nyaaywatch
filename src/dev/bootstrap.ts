import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
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
    await runMigrations(pool);

    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const sourceClient = createFixtureSourceClient(config.STATE_CODE);
    const service = new PublishedSnapshotService(config, profile, store, artifactStore, sourceClient);
    const existing = await service.getPublishedSnapshot();

    if (existing) {
      console.log(`Published snapshot already exists: ${existing.id}`);
      return;
    }

    const captured = await service.captureRun("Bootstrapped local dev fixture capture.");
    const result = await service.publishRun(captured.run.id, "Bootstrapped local dev published snapshot.");

    console.log(
      `Seeded run ${result.run.id}, snapshot ${result.snapshot.id}, publication ${result.publication.id}.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
