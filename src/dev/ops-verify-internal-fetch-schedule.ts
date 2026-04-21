import {
  assertInternalFetchSchedulesHealthy,
  parseInternalFetchScheduleWatchdogOptions,
  verifyInternalFetchSchedules,
} from "./internal-fetch-schedule-watchdog.js";

async function main() {
  const args = process.argv.slice(2);
  const options = parseInternalFetchScheduleWatchdogOptions(args);

  if (!options.baseUrl) {
    throw new Error(
      "Usage: tsx src/dev/ops-verify-internal-fetch-schedule.ts --base-url <https://nyaaywatch.in> [--stack-name <nyaaywatch-staging>] [--schedule-execution-lag-days <2>]",
    );
  }

  const summary = await verifyInternalFetchSchedules(options.baseUrl, options);
  console.log(JSON.stringify(summary, null, 2));
  assertInternalFetchSchedulesHealthy(summary);
}

await main();
