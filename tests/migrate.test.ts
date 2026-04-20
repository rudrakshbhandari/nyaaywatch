import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { DataType, newDb } from "pg-mem";
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

  it("backfills scope identity for legacy rows when applying the scope migration", async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
    db.public.registerFunction({
      name: "version",
      returns: DataType.text,
      implementation: () => "pg-mem",
    });

    const adapter = db.adapters.createPg();
    const pool = new adapter.Pool();

    try {
      const initialMigration = await readFile(join(sourceMigrationsDirectory, "001_initial.sql"), "utf8");

      await pool.query(initialMigration);
      await pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", ["001_initial.sql"]);

      await pool.query(
        `INSERT INTO runs (
          id, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note
        ) VALUES
          ('run_state', 'HP', 'state source', '2026-04-10T00:00:00.000Z', '2026.04-alpha', 'published', 'complete', 'state'),
          ('run_high', 'HPHC', 'high source', '2026-04-10T00:00:00.000Z', '2026.04-high-court-draft', 'published', 'complete', 'high'),
          ('run_supreme', 'SCI', 'supreme source', '2026-04-10T00:00:00.000Z', '2026.04-supreme-court-draft', 'published', 'complete', 'supreme')`,
      );

      await pool.query(
        `INSERT INTO published_snapshots (
          id, run_id, state_code, payload_version, payload, checksum_sha256
        ) VALUES
          ('snapshot_state', 'run_state', 'HP', 1, '{}'::jsonb, 'checksum-state'),
          ('snapshot_high', 'run_high', 'HPHC', 1, '{}'::jsonb, 'checksum-high'),
          ('snapshot_supreme', 'run_supreme', 'SCI', 1, '{}'::jsonb, 'checksum-supreme')`,
      );

      await pool.query(
        `INSERT INTO publication_history (
          id, state_code, published_snapshot_id, action, note
        ) VALUES
          ('publication_state', 'HP', 'snapshot_state', 'publish', 'state'),
          ('publication_high', 'HPHC', 'snapshot_high', 'publish', 'high'),
          ('publication_supreme', 'SCI', 'snapshot_supreme', 'publish', 'supreme')`,
      );

      const executed = await runMigrations(pool);
      expect(executed).toContain("002_scope_identity.sql");

      await expect(
        pool.query("SELECT state_code, scope_type, scope_code FROM runs ORDER BY id"),
      ).resolves.toMatchObject({
        rows: [
          { state_code: "HPHC", scope_type: "high_court", scope_code: "HPHC" },
          { state_code: "HP", scope_type: "lower_court_state", scope_code: "HP" },
          { state_code: "SCI", scope_type: "supreme_court", scope_code: "SCI" },
        ],
      });

      await expect(
        pool.query("SELECT state_code, scope_type, scope_code FROM published_snapshots ORDER BY id"),
      ).resolves.toMatchObject({
        rows: [
          { state_code: "HPHC", scope_type: "high_court", scope_code: "HPHC" },
          { state_code: "HP", scope_type: "lower_court_state", scope_code: "HP" },
          { state_code: "SCI", scope_type: "supreme_court", scope_code: "SCI" },
        ],
      });

      await expect(
        pool.query("SELECT state_code, scope_type, scope_code FROM publication_history ORDER BY id"),
      ).resolves.toMatchObject({
        rows: [
          { state_code: "HPHC", scope_type: "high_court", scope_code: "HPHC" },
          { state_code: "HP", scope_type: "lower_court_state", scope_code: "HP" },
          { state_code: "SCI", scope_type: "supreme_court", scope_code: "SCI" },
        ],
      });
    } finally {
      await pool.end();
    }
  });
});
