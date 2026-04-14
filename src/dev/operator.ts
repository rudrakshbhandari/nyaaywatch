import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { NjdgHimachalSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

async function main(): Promise<void> {
  const [command, targetId, ...rest] = process.argv.slice(2);
  if (!command) {
    throw new Error(
      "Usage: operator fetch [note] | inspect <run-id> | publish <run-id> [note] | replay <run-id> [note] | rollback <publication-id> [note]",
    );
  }

  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const sourceClient = new NjdgHimachalSourceClient();
    const service = new PublishedSnapshotService(config, store, artifactStore, sourceClient);

    if (command === "fetch") {
      const note = [targetId, ...rest].join(" ").trim() || undefined;
      console.log(JSON.stringify(await service.captureRun(note), null, 2));
      return;
    }

    if (!targetId) {
      throw new Error("This operator command requires a target id.");
    }

    const note = rest.join(" ").trim() || undefined;

    if (command === "inspect") {
      console.log(JSON.stringify(await service.inspectRun(targetId), null, 2));
      return;
    }

    if (command === "publish") {
      console.log(JSON.stringify(await service.publishRun(targetId, note), null, 2));
      return;
    }

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
