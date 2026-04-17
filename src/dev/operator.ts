import { parseOperatorInvocation, runOperatorInvocation } from "./operator-ops.js";

async function main(): Promise<void> {
  const invocation = parseOperatorInvocation(process.argv.slice(2));
  const result = await runOperatorInvocation(invocation);
  console.log(JSON.stringify(result, null, 2));
}

await main();
