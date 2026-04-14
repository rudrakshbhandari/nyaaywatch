import { describe, expect, it } from "vitest";

import { createTestContext } from "./helpers.js";
import { runMigrations } from "../src/db/migrate.js";

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
});
