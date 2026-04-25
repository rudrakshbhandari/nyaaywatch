import { verifyPublicRelease } from "./release-verification.js";
import { readFlag } from "./cli-flags.js";
import { pathToFileURL } from "node:url";

export async function main(args = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = readBaseUrl(args, env);
  const target = readReleaseVerifyTarget(args, env);
  const summary = await verifyPublicRelease(baseUrl, target);
  console.log(JSON.stringify(summary, null, 2));
}

function readBaseUrl(args: string[], env: NodeJS.ProcessEnv) {
  const value = readFlag(args, "--base-url");
  if (value) {
    return value;
  }

  const positional = args.find((value) => !value.startsWith("--"));
  if (positional) {
    return positional;
  }

  if (env.BASE_URL) {
    return env.BASE_URL;
  }

  throw new Error("Usage: tsx src/dev/release-verify.ts --base-url <https://nyaaywatch.in>");
}

export function readReleaseVerifyTarget(args: string[], env: NodeJS.ProcessEnv = process.env) {
  const cliStateSlug = readFlag(args, "--state-slug");
  const cliHighCourtSlug = readFlag(args, "--high-court");
  const cliSupremeCourt = args.includes("--supreme-court");
  const cliSelectedCount = countSelectedTargets(cliStateSlug, cliHighCourtSlug, cliSupremeCourt);
  if (cliSelectedCount > 1) {
    throw new Error("Select only one release target: --state-slug, --high-court, or --supreme-court.");
  }

  if (cliSelectedCount === 1) {
    return {
      stateSlug: cliStateSlug,
      highCourtSlug: cliHighCourtSlug,
      supremeCourt: cliSupremeCourt,
    };
  }

  const stateSlug = env.STATE_SLUG;
  const highCourtSlug = env.HIGH_COURT_SLUG;
  const supremeCourt = env.SUPREME_COURT === "1";
  const selectedCount = countSelectedTargets(stateSlug, highCourtSlug, supremeCourt);
  if (selectedCount > 1) {
    throw new Error("Select only one release target: --state-slug, --high-court, or --supreme-court.");
  }

  return { stateSlug, highCourtSlug, supremeCourt };
}

function countSelectedTargets(stateSlug: string | undefined, highCourtSlug: string | undefined, supremeCourt: boolean) {
  return [stateSlug, highCourtSlug, supremeCourt ? "supreme-court" : undefined].filter(Boolean).length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
