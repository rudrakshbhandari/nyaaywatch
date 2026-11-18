import { JOB_ERROR_PREFIX, JOB_RESULT_PREFIX } from "./job-entrypoint-format.js";
import { assertPublishPendingSweepSucceeded, runPublishPendingSweep } from "../ops/publish-pending-runner.js";

async function main() {
  try {
    const summary = await runPublishPendingSweep();
    console.log(`${JOB_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertPublishPendingSweepSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${JOB_ERROR_PREFIX}${message}`);
    throw error;
  }
}

await main();
