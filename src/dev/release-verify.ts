import { verifyPublicRelease } from "./release-verification.js";
import { readFlag } from "./cli-flags.js";

async function main() {
  const baseUrl = readBaseUrl();
  const target = readTarget();
  const summary = await verifyPublicRelease(baseUrl, target);
  console.log(JSON.stringify(summary, null, 2));
}

function readBaseUrl() {
  const args = process.argv.slice(2);
  const value = readFlag(args, "--base-url");
  if (value) {
    return value;
  }

  const positional = args.find((value) => !value.startsWith("--"));
  if (positional) {
    return positional;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  throw new Error("Usage: tsx src/dev/release-verify.ts --base-url <https://nyaaywatch.in>");
}

function readTarget() {
  const args = process.argv.slice(2);
  const stateSlug = readFlag(args, "--state-slug") ?? process.env.STATE_SLUG;
  const highCourtSlug = readFlag(args, "--high-court") ?? process.env.HIGH_COURT_SLUG;
  const supremeCourt = args.includes("--supreme-court") || process.env.SUPREME_COURT === "1";
  const selectedCount = [stateSlug, highCourtSlug, supremeCourt ? "supreme-court" : undefined].filter(Boolean).length;
  if (selectedCount > 1) {
    throw new Error("Select only one release target: --state-slug, --high-court, or --supreme-court.");
  }

  return { stateSlug, highCourtSlug, supremeCourt };
}

await main();
