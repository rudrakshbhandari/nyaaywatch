#!/usr/bin/env -S npx tsx

import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exportManifestPath, STATIC_COMPARISON_REWRITES, assertCloudflareRedirectBudget, assertExportedSitemapCoverage, normalizeOrigin } from "../src/export/public-site.js";

type ExportManifest = {
  resourceCount: number;
  sourceOrigin?: string;
  publicationIdentities: Array<{ scope: string; publishedAt: string }>;
  resources: Array<{ path: string; contentType: string; outputPath: string }>;
};

async function main(): Promise<void> {
  const outputRoot = resolve(process.argv[2] ?? "dist-public");
  const manifestPath = exportManifestPath(outputRoot);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ExportManifest;

  if (await pathExists(resolve(outputRoot, "export-manifest.json"))) {
    throw new Error("Static export must not publish export-manifest.json inside the public bundle.");
  }

  if (!Number.isInteger(manifest.resourceCount) || manifest.resourceCount < 1) {
    throw new Error("Static export manifest has no resources.");
  }
  if (manifest.resourceCount !== manifest.resources.length) {
    throw new Error("Static export manifest resource count does not match its resource list.");
  }
  if (!Array.isArray(manifest.publicationIdentities) || manifest.publicationIdentities.length === 0) {
    throw new Error("Static export manifest has no publication identities.");
  }
  const publicationScopes = new Set<string>();
  for (const identity of manifest.publicationIdentities) {
    if (!identity.scope || !identity.publishedAt || publicationScopes.has(identity.scope)) {
      throw new Error("Static export manifest has invalid or duplicate publication identities.");
    }
    publicationScopes.add(identity.scope);
  }

  await access(resolve(outputRoot, "index.html"));
  await access(resolve(outputRoot, "subscribe/index.html"));
  let sawSubscribeNotice = false;
  for (const resource of manifest.resources) {
    if (resource.path.startsWith("/operator") || resource.path === "/health") {
      throw new Error(`Operator or health route leaked into static export: ${resource.path}`);
    }
    if (resource.path.startsWith("/subscribe/confirm") || resource.path.startsWith("/unsubscribe")) {
      throw new Error(`Newsletter token route leaked into static export: ${resource.path}`);
    }
    if (resource.outputPath.includes("..")) {
      throw new Error(`Unsafe static output path: ${resource.outputPath}`);
    }
    await access(resolve(outputRoot, resource.outputPath));
    if (resource.contentType.toLowerCase().includes("text/html")) {
      const html = await readFile(resolve(outputRoot, resource.outputPath), "utf8");
      if (/method=["']post["'][^>]*action=["']\/subscribe["']/i.test(html) || /action=["']\/subscribe["'][^>]*method=["']post["']/i.test(html)) {
        throw new Error(`Static export still contains a newsletter POST form at ${resource.path}.`);
      }
    }
    if (resource.path === "/subscribe") {
      sawSubscribeNotice = true;
    }
  }
  if (!sawSubscribeNotice) {
    throw new Error("Static export is missing the /subscribe notice page.");
  }

  const redirects = await readFile(resolve(outputRoot, "_redirects"), "utf8");
  const redirectLines = redirects
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  assertCloudflareRedirectBudget(redirectLines);
  if (redirects.includes("/states/*/compare/*")) {
    throw new Error("Static export _redirects still uses a two-splat comparison rewrite that Cloudflare Pages will drop.");
  }
  for (const rewrite of STATIC_COMPARISON_REWRITES) {
    if (!redirects.split("\n").includes(rewrite)) {
      throw new Error(`Static export _redirects is missing ${rewrite}`);
    }
  }

  const sitemapXml = await readFile(resolve(outputRoot, "sitemap.xml"), "utf8");
  assertExportedSitemapCoverage(
    sitemapXml,
    normalizeOrigin(manifest.sourceOrigin ?? "https://nyaaywatch.in"),
    manifest.resources.map((resource) => resource.path),
  );

  console.log(`Verified ${manifest.resourceCount} static public resources in ${outputRoot}`);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
