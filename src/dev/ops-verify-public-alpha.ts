import {
  assertPublicAlphaOperationsHealthy,
  DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS,
  verifyPublicAlphaOperations,
} from "./public-alpha-ops.js";
import { readFlag } from "./cli-flags.js";

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = readFlag(args, "--base-url") ?? process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("Usage: tsx src/dev/ops-verify-public-alpha.ts --base-url <https://nyaaywatch.in> [--daily-fetch-lag-days <2>]");
  }

  const dailyFetchLagThresholdDays = readNumberFlag(args, "--daily-fetch-lag-days") ?? DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS;
  const summary = await verifyPublicAlphaOperations(baseUrl, {
    dailyFetchLagThresholdDays,
  });
  console.log(JSON.stringify(summary, null, 2));
  assertPublicAlphaOperationsHealthy(summary);
}

function readNumberFlag(args: string[], flag: string) {
  const value = readFlag(args, flag);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }

  return parsed;
}

await main();
