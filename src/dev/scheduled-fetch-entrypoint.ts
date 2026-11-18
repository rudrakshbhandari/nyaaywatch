import { pathToFileURL } from "node:url";

import { JOB_ERROR_PREFIX, JOB_RESULT_PREFIX } from "./job-entrypoint-format.js";
import { assertScheduledFetchSucceeded, runScheduledFetches } from "./scheduled-fetch.js";
import { createAlarmNotifier } from "../ops/alarm-notifier.js";

export async function main() {
  try {
    const notePrefix = process.argv.slice(2).join(" ").trim() || undefined;
    const summary = await runScheduledFetches(notePrefix);
    console.log(`${JOB_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertScheduledFetchSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${JOB_ERROR_PREFIX}${message}`);
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
