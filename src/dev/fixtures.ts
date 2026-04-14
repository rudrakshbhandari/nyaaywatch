import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { FixtureHimachalSourceClient } from "../ingest/himachal-source-client.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = join(repoRoot, "fixtures/himachal/raw-html");

export function createFixtureSourceClient(): FixtureHimachalSourceClient {
  return new FixtureHimachalSourceClient(fixtureRoot);
}
