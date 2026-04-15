import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { createTestContext } from "./helpers.js";
import { resolveMigrationsDirectory, runMigrations } from "../src/db/migrate.js";

const repoRoot = join(fileURLToPath(new URL("..", import.meta.url)));
const sourceMigrationsDirectory = join(repoRoot, "src", "db", "migrations");

describe("runMigrations", () => {
  it("applies the schema once and is idempotent on the second run", async () => {
    const { pool } = await createTestContext();

    const rerun = await runMigrations(pool);
    expect(rerun).toEqual([]);

    await expect(pool.query("SELECT * FROM runs LIMIT 0")).resolves.toBeDefined();
    await expect(pool.query("SELECT * FROM run_artifacts LIMIT 0")).resolves.toBeDefined();
    await expect(pool.query("SELECT * FROM published_snapshots LIMIT 0")).resolves.toBeDefined();
    await expect(pool.query("SELECT * FROM publication_history LIMIT 0")).resolves.toBeDefined();

    await pool.end();
  });

  it("falls back to source migrations when running from a compiled dist path", () => {
    const compiledModuleUrl = pathToFileURL(join(repoRoot, "dist", "src", "db", "migrate.js"));
    const resolvedDirectory = resolveMigrationsDirectory(compiledModuleUrl);

    expect([
      join(repoRoot, "dist", "src", "db", "migrations"),
      sourceMigrationsDirectory,
    ]).toContain(resolvedDirectory);
  });
});
