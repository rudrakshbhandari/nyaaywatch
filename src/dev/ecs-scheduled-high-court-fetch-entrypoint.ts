import { pathToFileURL } from "node:url";

import { ECS_OPERATOR_ERROR_PREFIX, ECS_OPERATOR_RESULT_PREFIX } from "./staging-operator-ops.js";
import { createAlarmNotifier } from "../ops/alarm-notifier.js";
import { assertScheduledHighCourtFetchSucceeded, runScheduledHighCourtFetches } from "./scheduled-high-court-fetch.js";

export async function main() {
  try {
    const notePrefix = process.argv.slice(2).join(" ").trim() || undefined;
    const summary = await runScheduledHighCourtFetches(notePrefix);
    console.log(`${ECS_OPERATOR_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertScheduledHighCourtFetchSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${ECS_OPERATOR_ERROR_PREFIX}${message}`);
    await createAlarmNotifier().publish("NyaayWatch High Court fetch failed", message);
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
