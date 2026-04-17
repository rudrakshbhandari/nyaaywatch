import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { getStateProfile, getStateProfileByCodeOrSlug } from "../geographies.js";
import { NjdgStateSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";
import { buildPostpublishSummary } from "./release-ops.js";

async function main() {
  const args = parseArgs();
  const config = loadConfig({
    ...process.env,
    ...(args.stateCode ? { STATE_CODE: args.stateCode } : {}),
  });
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
  const stateCode = resolveStateCode(args);

  if (!publicationId || !baseUrl) {
    throw new Error(
      "Usage: tsx src/dev/release-postpublish.ts [--state <HP|PB> | --state-slug <state-slug>] --publication-id <publication-id> --base-url <https://nyaaywatch.in> [--output <path>]",
    );
  }

  return { publicationId, baseUrl, outputPath, stateCode };
}

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function resolveStateCode(args: string[]) {
  const selected = readFlag(args, "--state-slug") ?? readFlag(args, "--state") ?? process.env.STATE_SLUG;
  if (!selected) {
    return undefined;
  }

  const profile = getStateProfileByCodeOrSlug(selected);
  if (!profile) {
    throw new Error(`Unsupported state selector: ${selected}`);
  }

  return profile.stateCode;
}

await main();
