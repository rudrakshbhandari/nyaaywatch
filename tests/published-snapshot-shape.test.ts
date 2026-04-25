import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { HighCourtPublishedSnapshotSchema } from "../src/domain/high-court-snapshot-schema.js";
import { SupremeCourtPublishedSnapshotSchema } from "../src/domain/supreme-court-snapshot-schema.js";

// These fixtures are frozen copies of the *shape* of payloads that have
// already been published to production. They are NOT the canonical shape we
// publish today — they intentionally include older shapes that newer schema
// versions must keep parsing.
//
// Why this exists: published payloads live in Postgres JSONB and are parsed
// at read time by the schema. If a schema change adds a required field that
// existing rows don't have, every read 500s the public site (this is exactly
// what happened in #203 / #206 — `monthlyFinalized` became required while
// the live SC row predated the field, so the home page 500'd until #206
// gave the field a default).
//
// Adding a required field to one of these schemas? You have two options:
//   1. Make it optional or `.default(...)` so legacy rows still parse, OR
//   2. Republish every affected row before the schema change ships, AND
//      update the corresponding fixture below to include the new field.
//
// If neither happens, this test should fail in CI and stop the schema change
// from reaching prod.

const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "published-snapshot-shapes");

function loadFixture(filename: string): unknown {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIR, filename), "utf8"));
}

describe("Supreme Court published snapshot — shape compatibility", () => {
  it("parses payloads written before monthlyFinalized was introduced (regression for #203 / #206)", () => {
    const legacy = loadFixture("supreme-court-pre-monthly-finalized.json");
    const result = SupremeCourtPublishedSnapshotSchema.safeParse(legacy);
    expect(result.success, formatFailure("supreme-court-pre-monthly-finalized.json", result)).toBe(true);
  });
});

describe("High Court published snapshot — shape compatibility", () => {
  it("parses payloads without caseTypeBreakdown (older HCs publish without it)", () => {
    const fixture = loadFixture("high-court-without-case-type-breakdown.json");
    const result = HighCourtPublishedSnapshotSchema.safeParse(fixture);
    expect(result.success, formatFailure("high-court-without-case-type-breakdown.json", result)).toBe(true);
  });
});

function formatFailure(name: string, result: { success: boolean; error?: { issues: unknown[] } }): string {
  if (result.success) {
    return "";
  }
  return `Schema rejected ${name}. If you added a required field, either make it optional/default or republish + refresh the fixture. Issues: ${JSON.stringify(result.error?.issues, null, 2)}`;
}
