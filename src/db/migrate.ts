import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

import { loadConfig } from "../config/env.js";

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations(pool: Pick<Pool, "query">): Promise<string[]> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  const appliedResult = await pool.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(appliedResult.rows.map((row: { id: string }) => row.id));
  const executed: string[] = [];

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      continue;
    }

    const sql = await readFile(join(migrationsDirectory, fileName), "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", [fileName]);
      await pool.query("COMMIT");
      executed.push(fileName);
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  return executed;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  try {
    const executed = await runMigrations(pool);
    if (executed.length === 0) {
      console.log("No new migrations.");
    } else {
      console.log(`Applied migrations: ${executed.join(", ")}`);
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
