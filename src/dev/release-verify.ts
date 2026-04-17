import { verifyPublicRelease } from "./release-verification.js";

async function main() {
  const baseUrl = readBaseUrl();
  const stateSlug = readStateSlug();
  const summary = await verifyPublicRelease(baseUrl, stateSlug ? { stateSlug } : undefined);
  console.log(JSON.stringify(summary, null, 2));
}

function readBaseUrl() {
  const args = process.argv.slice(2);
  const flagIndex = args.findIndex((value) => value === "--base-url");
  if (flagIndex >= 0) {
    const value = args[flagIndex + 1];
    if (value) {
      return value;
    }
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

function readStateSlug() {
  const args = process.argv.slice(2);
  const flagIndex = args.findIndex((value) => value === "--state-slug");
  if (flagIndex >= 0) {
    const value = args[flagIndex + 1];
    if (value) {
      return value;
    }
  }

  if (process.env.STATE_SLUG) {
    return process.env.STATE_SLUG;
  }

  return undefined;
}

await main();
