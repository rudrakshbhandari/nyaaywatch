import { runAutoPublishCli } from "./auto-publish.js";

async function main() {
  const summary = await runAutoPublishCli(process.argv.slice(2));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failedCount > 0) {
    process.exitCode = 1;
  }
}

await main();
