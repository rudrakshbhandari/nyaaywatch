import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { getStateProfile } from "../geographies.js";
import { NjdgStateSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";
import { buildPrepublishSummary } from "./release-ops.js";

async function main() {
  const args = parseArgs();
  const config = loadConfig();
  const profile = getStateProfile(config.STATE_CODE);
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const service = new PublishedSnapshotService(
      config,
      profile,
      PgWarehouseStore.fromPool(pool),
      new S3ArtifactStore(config),
      new NjdgStateSourceClient(profile),
    );
    const summary = await buildPrepublishSummary(service, args.baseUrl, args.runId);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const runId = readFlag(args, "--run-id");
  const baseUrl = readFlag(args, "--base-url") ?? process.env.BASE_URL;

  if (!runId || !baseUrl) {
    throw new Error("Usage: tsx src/dev/release-prepublish.ts --run-id <run-id> --base-url <https://nyaaywatch.in>");
  }

  return { runId, baseUrl };
}

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

await main();
