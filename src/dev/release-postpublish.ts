import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { NjdgHimachalSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";
import { buildPostpublishSummary } from "./release-ops.js";

async function main() {
  const args = parseArgs();
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const service = new PublishedSnapshotService(
      config,
      PgWarehouseStore.fromPool(pool),
      new S3ArtifactStore(config),
      new NjdgHimachalSourceClient(),
    );
    const summary = await buildPostpublishSummary(service, args.baseUrl, args.publicationId, args.outputPath);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const publicationId = readFlag(args, "--publication-id");
  const baseUrl = readFlag(args, "--base-url") ?? process.env.BASE_URL;
  const outputPath = readFlag(args, "--output");

  if (!publicationId || !baseUrl) {
    throw new Error(
      "Usage: tsx src/dev/release-postpublish.ts --publication-id <publication-id> --base-url <https://nyaaywatch.in> [--output <path>]",
    );
  }

  return { publicationId, baseUrl, outputPath };
}

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

await main();
