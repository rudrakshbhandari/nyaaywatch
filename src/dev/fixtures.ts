import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PublishedSnapshotSchema, type PublishedSnapshot } from "../domain/snapshot-schema.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export async function loadSeedFixture(): Promise<{
  publishedSnapshot: PublishedSnapshot;
  rawArtifact: unknown;
}> {
  const publishedSnapshot = JSON.parse(
    await readFile(join(repoRoot, "fixtures/himachal/published-snapshot.json"), "utf8"),
  );
  const rawArtifact = JSON.parse(await readFile(join(repoRoot, "fixtures/himachal/raw-dashboard.json"), "utf8"));

  return {
    publishedSnapshot: PublishedSnapshotSchema.parse(publishedSnapshot),
    rawArtifact,
  };
}
