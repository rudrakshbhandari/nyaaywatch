import dotenv from "dotenv";
import { pathToFileURL } from "node:url";

import { buildPublicHighCourtRoutes } from "../api/public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../api/public-supreme-court.js";
import { getHighCourtProfileBySlug } from "../high-courts.js";
import { PublicCacheInvalidationService, type PublicCacheInvalidationConfig } from "../services/public-cache-invalidation.js";

dotenv.config();

function printUsage() {
  console.error(
    [
      "Usage:",
      '  npm run release:purge-public-routes -- --supreme-court',
      '  npm run release:purge-public-routes -- --high-court=<court-slug>[,<court-slug>...]',
      '  npm run release:purge-public-routes -- --high-court=<court-slug> --allow-missing-cloudflare',
    ].join("\n"),
  );
}

function buildBaseUrl(config: PublicCacheInvalidationConfig) {
  if (config.PUBLIC_BASE_URL) {
    return config.PUBLIC_BASE_URL;
  }

  if (config.CANONICAL_HOST) {
    return `https://${config.CANONICAL_HOST}`;
  }

  throw new Error("PUBLIC_BASE_URL or CANONICAL_HOST is required to purge public routes.");
}

export function loadReleasePurgeConfig(env: NodeJS.ProcessEnv = process.env): PublicCacheInvalidationConfig {
  return {
    CANONICAL_HOST: env.CANONICAL_HOST,
    CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ZONE_ID: env.CLOUDFLARE_ZONE_ID,
    CLOUDFLARE_ZONE_NAME: env.CLOUDFLARE_ZONE_NAME,
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL,
  };
}

export function assertReleasePurgeConfig(config: PublicCacheInvalidationConfig) {
  const missing: string[] = [];

  if (!config.CLOUDFLARE_API_TOKEN) {
    missing.push("CLOUDFLARE_API_TOKEN");
  }

  if (!config.CLOUDFLARE_ZONE_ID && !config.CLOUDFLARE_ZONE_NAME && !config.CANONICAL_HOST) {
    missing.push("CLOUDFLARE_ZONE_ID or CLOUDFLARE_ZONE_NAME or CANONICAL_HOST");
  }

  if (missing.length > 0) {
    throw new Error(
      [
        `release:purge-public-routes requires Cloudflare configuration for release purges. Missing: ${missing.join(", ")}.`,
        "Use --allow-missing-cloudflare only for local route construction checks where a skipped purge is intentional.",
      ].join(" "),
    );
  }
}

export async function main(args = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env) {
  const purgeSupremeCourt = args.includes("--supreme-court");
  const allowMissingCloudflare = args.includes("--allow-missing-cloudflare");
  const highCourtArg = args.find((arg) => arg.startsWith("--high-court="));
  const highCourtSlugs =
    highCourtArg
      ?.slice("--high-court=".length)
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) ?? [];

  if (!purgeSupremeCourt && highCourtSlugs.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const config = loadReleasePurgeConfig(env);
  const baseUrl = buildBaseUrl(config);
  if (!allowMissingCloudflare) {
    assertReleasePurgeConfig(config);
  }

  const service = new PublicCacheInvalidationService(config);

  if (purgeSupremeCourt) {
    const routes = buildPublicSupremeCourtRoutes();
    await service.invalidateExplicitUrls(
      [routes.home, routes.data, routes.methodology, routes.api, routes.statsApi, routes.trendsApi].map((path) =>
        new URL(path, baseUrl).toString(),
      ),
      "supreme_court_manual_release_purge",
    );
  }

  for (const courtSlug of highCourtSlugs) {
    const profile = getHighCourtProfileBySlug(courtSlug);
    if (!profile) {
      throw new Error(`Unknown High Court slug: ${courtSlug}`);
    }

    const routes = buildPublicHighCourtRoutes(profile);
    await service.invalidateExplicitUrls(
      [routes.index, routes.home, routes.data, routes.methodology, routes.api, routes.statsApi, routes.trendsApi].map((path) =>
        new URL(path, baseUrl).toString(),
      ),
      `high_court_manual_release_purge:${courtSlug}`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
