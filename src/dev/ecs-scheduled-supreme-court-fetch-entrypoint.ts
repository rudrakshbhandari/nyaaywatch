import { ECS_OPERATOR_ERROR_PREFIX, ECS_OPERATOR_RESULT_PREFIX } from "./staging-operator-ops.js";
import { assertScheduledSupremeCourtFetchSucceeded, runScheduledSupremeCourtFetch } from "./scheduled-supreme-court-fetch.js";

async function main() {
  try {
    const notePrefix = process.argv.slice(2).join(" ").trim() || undefined;
    const summary = await runScheduledSupremeCourtFetch(notePrefix);
    console.log(`${ECS_OPERATOR_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertScheduledSupremeCourtFetchSucceeded(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${ECS_OPERATOR_ERROR_PREFIX}${message}`);
    throw error;
  }
}

await main();
