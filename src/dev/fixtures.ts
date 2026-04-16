import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getStateProfile, type SupportedStateCode } from "../geographies.js";
import { FixtureNjdgStateSourceClient } from "../ingest/himachal-source-client.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = join(repoRoot, "fixtures/himachal/raw-html");

export function createFixtureSourceClient(stateCode: SupportedStateCode = "HP"): FixtureNjdgStateSourceClient {
  return new FixtureNjdgStateSourceClient(getStateProfile(stateCode), fixtureRoot);
}
