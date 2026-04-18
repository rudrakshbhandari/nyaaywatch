import {
  assertFetchScheduleWatchdogHealthy,
  parseFetchScheduleWatchdogOptions,
  verifyFetchScheduleWatchdog,
} from "./internal-fetch-schedule-watchdog.js";

async function main() {
  const options = parseFetchScheduleWatchdogOptions(process.argv.slice(2));
  if (!options.baseUrl) {
    throw new Error(
      "Usage: tsx src/dev/ops-verify-internal-fetch-schedule.ts --base-url <https://nyaaywatch.in> [--stack-name <nyaaywatch-staging>] [--schedule-name <nyaaywatch-staging-weekday-internal-fetch>] [--schedule-execution-lag-days <2>]",
    );
  }
  if (!options.operatorToken) {
    throw new Error(
      "ops:verify-internal-fetch-schedule requires OPERATOR_API_TOKEN so recent scheduled operator runs can be checked.",
    );
  }

  const summary = await verifyFetchScheduleWatchdog(options.baseUrl, options);
  console.log(JSON.stringify(summary, null, 2));
  assertFetchScheduleWatchdogHealthy(summary);
}

await main();
