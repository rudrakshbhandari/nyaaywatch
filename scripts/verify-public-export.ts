#!/usr/bin/env -S npx tsx

import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

type ExportManifest = {
  resourceCount: number;
  publicationIdentities: Array<{ scope: string; publishedAt: string }>;
  resources: Array<{ path: string; contentType: string; outputPath: string }>;
};

async function main(): Promise<void> {
  const outputRoot = resolve(process.argv[2] ?? "dist-public");
  const manifestPath = resolve(outputRoot, "export-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ExportManifest;

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

  console.log(`Verified ${manifest.resourceCount} static public resources in ${outputRoot}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
