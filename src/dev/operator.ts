import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { getStateProfile } from "../geographies.js";
import { NjdgStateSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const stateCode = readFlag(args, "--state");
  const positionals = stripFlag(args, "--state");
  const [command, targetId, ...rest] = positionals;
  if (!command) {
    throw new Error(
      "Usage: operator [--state <HP|PB>] fetch [note] | inspect <run-id> | publications | publish <run-id> [note] | replay <run-id> [note] | rollback <publication-id> [note]",
    );
  }

  const config = loadConfig({
    ...process.env,
    ...(stateCode ? { STATE_CODE: stateCode } : {}),
  });
  const profile = getStateProfile(config.STATE_CODE);
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    const sourceClient = new NjdgStateSourceClient(profile);
    const service = new PublishedSnapshotService(config, profile, store, artifactStore, sourceClient);

    if (command === "fetch") {
      const note = [targetId, ...rest].join(" ").trim() || undefined;
      console.log(JSON.stringify(await service.captureRun(note), null, 2));
      return;
    }

    if (command === "publications") {
      console.log(JSON.stringify(await service.listPublicationHistory(), null, 2));
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

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function stripFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  if (index < 0) {
    return args;
  }

  return args.filter((_, currentIndex) => currentIndex !== index && currentIndex !== index + 1);
}

await main();
