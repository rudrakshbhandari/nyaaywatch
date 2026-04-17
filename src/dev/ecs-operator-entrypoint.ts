import { parseOperatorInvocation, runOperatorInvocation } from "./operator-ops.js";
import { ECS_OPERATOR_ERROR_PREFIX, ECS_OPERATOR_RESULT_PREFIX } from "./staging-operator-ops.js";

async function main() {
  try {
    const invocation = parseOperatorInvocation(process.argv.slice(2));
    const result = await runOperatorInvocation(invocation);
    console.log(`${ECS_OPERATOR_RESULT_PREFIX}${JSON.stringify(result)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${ECS_OPERATOR_ERROR_PREFIX}${message}`);
    throw error;
  }
}

await main();
