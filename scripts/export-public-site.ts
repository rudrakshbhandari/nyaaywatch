#!/usr/bin/env -S npx tsx

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listPublicStateProfiles } from "../src/geographies.js";
import { listPublicHighCourtProfiles } from "../src/high-courts.js";
import {
  DEFAULT_SEED_PATHS,
  buildStaticRedirects,
  extractInternalUrls,
  extractSitemapUrls,
  normalizeOrigin,
  outputPathForResource,
  prepareOutputDirectory,
  assertExportResourceIdentities,
  buildStaticComparisonShell,
  buildStaticSubscribeNotice,
  type PublicResource,
  type PublicationIdentity,
  writePublicResource,
} from "../src/export/public-site.js";
import { buildPublicHighCourtRoutes } from "../src/api/public-high-court.js";
import { buildPublicStateRoutes } from "../src/api/public-state.js";
import { buildPublicSupremeCourtRoutes } from "../src/api/public-supreme-court.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_PAGES = 15_000;
const FETCH_CONCURRENCY = 16;

function buildPublicRouteInventory(): string[] {
  const paths = new Set([
    "/",
    "/press",
    "/learn",
    "/watch",
    "/watch/backlog-concentration",
    "/watch/old-case-burden",
    "/watch/persistent-pressure",
  ]);

  for (const profile of listPublicStateProfiles()) {
    const routes = buildPublicStateRoutes(profile);
    [
      routes.home,
      routes.districts,
      routes.movers,
      routes.data,
      routes.stateEvidencePack,
      routes.districtsCsv,
      routes.methodology,
      routes.api,
      routes.statsApi,
      routes.districtsApi,
      routes.trendsApi,
      `/states/${profile.stateSlug}/feed.xml`,
      `/embed/state/${profile.stateSlug}`,
    ].forEach((path) => paths.add(path));
  }

  for (const profile of listPublicHighCourtProfiles()) {
    const routes = buildPublicHighCourtRoutes(profile);
    [routes.home, routes.methodology, routes.api, routes.data, routes.statsApi, routes.trendsApi].forEach((path) => paths.add(path));
  }

  const supremeRoutes = buildPublicSupremeCourtRoutes();
  [supremeRoutes.home, supremeRoutes.methodology, supremeRoutes.api, supremeRoutes.data, supremeRoutes.statsApi, supremeRoutes.trendsApi].forEach((path) => paths.add(path));
  return [...paths].sort();
}

type CliOptions = {
  baseUrl: string;
  outputDir: string;
  maxPages: number;
};

function parseOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseUrl: process.env.PUBLIC_BASE_URL ?? "https://nyaaywatch.in",
    outputDir: "dist-public",
    maxPages: DEFAULT_MAX_PAGES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--base-url" && value) {
      options.baseUrl = value;
      index += 1;
    } else if (argument.startsWith("--base-url=") && argument.slice("--base-url=".length)) {
      options.baseUrl = argument.slice("--base-url=".length);
    } else if (argument === "--output-dir" && value) {
      options.outputDir = value;
      index += 1;
    } else if (argument.startsWith("--output-dir=") && argument.slice("--output-dir=".length)) {
      options.outputDir = argument.slice("--output-dir=".length);
    } else if (argument === "--max-pages" && value) {
      options.maxPages = Number.parseInt(value, 10);
      index += 1;
    } else if (argument.startsWith("--max-pages=") && argument.slice("--max-pages=".length)) {
      options.maxPages = Number.parseInt(argument.slice("--max-pages=".length), 10);
    } else if (argument === "--help") {
      console.log("Usage: npm run export:public -- [--base-url URL] [--output-dir DIR] [--max-pages N]");
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.maxPages) || options.maxPages < 1) {
    throw new Error("--max-pages must be a positive integer.");
  }
  return options;
}

async function fetchResource(url: URL): Promise<PublicResource | null> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "nyaaywatch-static-export/1.0" },
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404 && url.search) {
          const querylessUrl = new URL(url.href);
          querylessUrl.search = "";
          return fetchResource(querylessUrl);
        }
        if (response.status === 404 && isOptionalAssetUrl(url)) {
          console.warn(`Skipping missing optional asset ${url.pathname}`);
          return null;
        }
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type") ?? "application/octet-stream";
      const publicationIdentitiesHeader = response.headers.get("x-nyaaywatch-publication-identities");
      let publicationIdentities: PublicationIdentity[] | undefined;
      if (publicationIdentitiesHeader) {
        try {
          publicationIdentities = JSON.parse(publicationIdentitiesHeader) as PublicationIdentity[];
        } catch {
          throw new Error(`Invalid publication identity header from ${url.href}`);
        }
      }
      return {
        url,
        body: new Uint8Array(await response.arrayBuffer()),
        contentType,
        publicationIdentities,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 500));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`Failed to fetch ${url.href}: ${String(lastError)}`);
}

function isOptionalAssetUrl(url: URL): boolean {
  return /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname);
}

function isHtml(resource: PublicResource): boolean {
  return resource.contentType.toLowerCase().includes("text/html");
}

function extractDistrictIds(resource: PublicResource): string[] {
  if (!resource.contentType.toLowerCase().includes("json")) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(resource.body));
  } catch {
    return [];
  }

  const ids = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.districtId === "string" && record.districtId.length > 0) {
      ids.add(record.districtId);
    }
    Object.values(record).forEach(visit);
  };
  visit(parsed);
  return [...ids].sort();
}

function buildDistrictRouteInventory(resource: PublicResource): string[] {
  const districtIds = extractDistrictIds(resource);
  if (districtIds.length === 0) {
    return [];
  }

  const stateApiMatch = resource.url.pathname.match(/^\/v1\/states\/([^/]+)\/districts$/);
  const prefix = stateApiMatch ? `/states/${stateApiMatch[1]}` : "";
  return districtIds.flatMap((districtId) => [
    `${prefix}/districts/${districtId}`,
    `${prefix}/data/districts/${districtId}.csv`,
    `${prefix}/data/evidence/districts/${districtId}.json`,
    ...(prefix ? [] : [`/embed/district/${districtId}`]),
  ]);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const origin = normalizeOrigin(options.baseUrl);
  const outputRoot = resolve(options.outputDir);
  await prepareOutputDirectory(outputRoot);

  const queue: URL[] = [...new Set([...DEFAULT_SEED_PATHS, ...buildPublicRouteInventory()])].map((path) => new URL(path, origin));
  const queued = new Set(queue.map((url) => url.href));
  const visited = new Set<string>();
  const resources: PublicResource[] = [];
  const publicationIdentities = new Map<string, PublicationIdentity>();

  while (queue.length > 0) {
    if (visited.size >= options.maxPages) {
      throw new Error(`Reached --max-pages=${options.maxPages} before the public crawl completed.`);
    }

    const batch: URL[] = [];
    while (queue.length > 0 && batch.length < FETCH_CONCURRENCY && visited.size < options.maxPages) {
      const url = queue.shift();
      if (url && !visited.has(url.href)) {
        visited.add(url.href);
        batch.push(url);
      }
    }

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const resource = await fetchResource(url);
        if (!resource) {
          return null;
        }
        return resource;
      }),
    );

    for (const resource of batchResults) {
      if (!resource) {
        continue;
      }

      assertExportResourceIdentities(publicationIdentities, resource);

      await writePublicResource(resource, outputRoot);
      resources.push(resource);
      console.log(`${resources.length}\t${resource.url.pathname}\t${resource.contentType.split(";", 1)[0]}`);

      const body = new TextDecoder().decode(resource.body);
      for (const path of buildDistrictRouteInventory(resource)) {
        const discoveredUrl = new URL(path, origin);
        if (!queued.has(discoveredUrl.href)) {
          queued.add(discoveredUrl.href);
          queue.push(discoveredUrl);
        }
      }
      const discoveredUrls = isHtml(resource)
        ? extractInternalUrls(body, resource.url, origin)
        : resource.url.pathname.endsWith("sitemap.xml")
          ? extractSitemapUrls(body, origin)
          : [];
      for (const discoveredUrl of discoveredUrls) {
        if (!queued.has(discoveredUrl.href)) {
          queued.add(discoveredUrl.href);
          queue.push(discoveredUrl);
        }
      }
    }
  }

  const comparisonShell = buildStaticComparisonShell(origin);
  await writePublicResource(comparisonShell, outputRoot);
  resources.push(comparisonShell);

  const subscribeNotice = buildStaticSubscribeNotice(origin);
  await writePublicResource(subscribeNotice, outputRoot);
  resources.push(subscribeNotice);

  const redirects = [
    ...new Set([
      ...buildStaticRedirects(resources, outputRoot),
      "/compare/* /compare/index.html 200",
      "/states/*/compare/* /compare/index.html 200",
    ]),
  ].sort();
  if (redirects.length > 0) {
    await writeFile(resolve(outputRoot, "_redirects"), `${redirects.join("\n")}\n`);
  }
  await writeFile(
    resolve(outputRoot, "export-manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceOrigin: origin.origin,
        resourceCount: resources.length,
        publicationIdentities: [...publicationIdentities.values()]
          .filter((identity): identity is PublicationIdentity => identity.publishedAt !== null)
          .sort((left, right) => left.scope.localeCompare(right.scope)),
        resources: resources.map((resource) => ({
          path: resource.url.pathname,
          contentType: resource.contentType,
          outputPath: outputPathForResource(resource.url, resource.contentType),
        })),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Exported ${resources.length} public resources to ${outputRoot}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
