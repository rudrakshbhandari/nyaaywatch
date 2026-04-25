import { ECS_OPERATOR_ERROR_PREFIX, ECS_OPERATOR_RESULT_PREFIX } from "./staging-operator-ops.js";
import { assertPublishPendingSweepSucceeded, runPublishPendingSweep } from "../ops/publish-pending-runner.js";

async function main() {
  try {
    const summary = await runPublishPendingSweep();
    console.log(`${ECS_OPERATOR_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertPublishPendingSweepSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${ECS_OPERATOR_ERROR_PREFIX}${message}`);
    throw error;
  }
}

await main();
