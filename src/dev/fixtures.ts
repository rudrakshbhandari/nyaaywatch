import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getStateProfile, type SupportedStateCode } from "../geographies.js";
import { FixtureNjdgStateSourceClient, type NjdgSourceClient } from "../ingest/himachal-source-client.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const FIXTURE_DIRECTORY_BY_STATE_CODE: Partial<Record<SupportedStateCode, string>> = {
  HP: "himachal",
  PB: "punjab",
};

export function createFixtureSourceClient(stateCode: SupportedStateCode = "HP"): NjdgSourceClient {
  const profile = getStateProfile(stateCode);
  const fixtureRoot = resolveFixtureRoot(stateCode);

  if (!fixtureRoot) {
    return {
      async captureLatest() {
        throw new Error(`No checked-in fixture set is available for ${profile.stateCode} (${profile.stateName}).`);
      },
    };
  }

  return new FixtureNjdgStateSourceClient(profile, fixtureRoot);
}

function resolveFixtureRoot(stateCode: SupportedStateCode) {
  const directoryName = FIXTURE_DIRECTORY_BY_STATE_CODE[stateCode];
  if (!directoryName) {
    return null;
  }

  const fixtureRoot = join(repoRoot, "fixtures", directoryName, "raw-html");
  return existsSync(join(fixtureRoot, "state.html")) ? fixtureRoot : null;
}
