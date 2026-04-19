import { buildPublicHighCourtRoutes } from "../api/public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../api/public-supreme-court.js";
import { loadConfig } from "../config/env.js";
import { getHighCourtProfileBySlug } from "../high-courts.js";
import { PublicCacheInvalidationService } from "../services/public-cache-invalidation.js";

function printUsage() {
  console.error(
    [
      "Usage:",
      '  npm run release:purge-public-routes -- --supreme-court',
      '  npm run release:purge-public-routes -- --high-court=<court-slug>[,<court-slug>...]',
    ].join("\n"),
  );
}

function buildBaseUrl(config: ReturnType<typeof loadConfig>) {
  if (config.PUBLIC_BASE_URL) {
    return config.PUBLIC_BASE_URL;
  }

  if (config.CANONICAL_HOST) {
    return `https://${config.CANONICAL_HOST}`;
  }

  throw new Error("PUBLIC_BASE_URL or CANONICAL_HOST is required to purge public routes.");
}

async function main() {
  const args = process.argv.slice(2);
  const purgeSupremeCourt = args.includes("--supreme-court");
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

  const config = loadConfig();
  const service = new PublicCacheInvalidationService(config);
  const baseUrl = buildBaseUrl(config);

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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
