import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

async function main(): Promise<void> {
  const [command, targetId, ...rest] = process.argv.slice(2);
  if (!command || !targetId) {
    throw new Error("Usage: npm run operator:replay -- <run-id> [note] OR npm run operator:rollback -- <publication-id> [note]");
  }

  const note = rest.join(" ").trim() || undefined;
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const service = new PublishedSnapshotService(config, store, artifactStore);

    if (command === "replay") {
      console.log(JSON.stringify(await service.replayRun(targetId, note), null, 2));
      return;
    }

    if (command === "rollback") {
      console.log(JSON.stringify(await service.rollbackPublication(targetId, note), null, 2));
      return;
    }

    throw new Error(`Unsupported operator command: ${command}`);
  } finally {
    await pool.end();
  }
}

await main();
