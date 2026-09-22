import { pathToFileURL } from "node:url";

import { ECS_OPERATOR_ERROR_PREFIX, ECS_OPERATOR_RESULT_PREFIX } from "./staging-operator-ops.js";
import { assertScheduledFetchSucceeded, runScheduledFetches } from "./scheduled-fetch.js";
import { createAlarmNotifier } from "../ops/alarm-notifier.js";

export async function main() {
  try {
    const notePrefix = process.argv.slice(2).join(" ").trim() || undefined;
    const summary = await runScheduledFetches(notePrefix);
    console.log(`${ECS_OPERATOR_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertScheduledFetchSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${ECS_OPERATOR_ERROR_PREFIX}${message}`);
    try {
      await createAlarmNotifier().publish("NyaayWatch scheduled fetch failed", message);
    } catch (notificationError) {
      const notificationMessage = notificationError instanceof Error ? notificationError.message : String(notificationError);
      console.error(`[alarm-notifier] Failed to publish scheduled fetch failure: ${notificationMessage}`);
    }
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
