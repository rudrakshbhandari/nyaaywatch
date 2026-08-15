#!/usr/bin/env -S npx tsx

import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

type ExportManifest = {
  resourceCount: number;
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

  await access(resolve(outputRoot, "index.html"));
  for (const resource of manifest.resources) {
    if (resource.path.startsWith("/operator") || resource.path === "/health") {
      throw new Error(`Operator or health route leaked into static export: ${resource.path}`);
    }
    if (resource.outputPath.includes("..")) {
      throw new Error(`Unsafe static output path: ${resource.outputPath}`);
    }
    await access(resolve(outputRoot, resource.outputPath));
  }

  console.log(`Verified ${manifest.resourceCount} static public resources in ${outputRoot}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
