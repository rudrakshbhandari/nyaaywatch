import { describe, expect, it } from "vitest";

import { findUnpublishedCompleteRuns } from "../src/ops/publish-pending-runner.js";
import type { RunRecord } from "../src/storage/postgres.js";

function makeRun(overrides: Partial<RunRecord> & Pick<RunRecord, "id" | "status" | "createdAt">): RunRecord {
  return {
    scopeType: "supreme_court",
    scopeCode: "SCI",
    stateCode: "SCI",
    sourceLabel: "sc-njdg",
    sourceSnapshotAt: overrides.createdAt,
    methodologyVersion: "2026.04-supreme-court-draft",
    qualityState: "complete",
    replayOfRunId: null,
    note: null,
    completedAt: overrides.createdAt,
    ...overrides,
  };
}

describe("findUnpublishedCompleteRuns", () => {
  const since = "2026-04-22T00:00:00.000Z";

  it("returns all eligible runs in chronological order", () => {
    // listRuns returns DESC by createdAt
    const runs = [
      makeRun({ id: "run_apr25", status: "completed", createdAt: "2026-04-25T08:10:00.000Z" }),
      makeRun({ id: "run_apr24", status: "completed", createdAt: "2026-04-24T08:10:00.000Z" }),
      makeRun({ id: "run_apr23", status: "published", createdAt: "2026-04-23T08:10:00.000Z" }),
    ];

    const candidates = findUnpublishedCompleteRuns(runs, since);

    expect(candidates.map((r) => r.id)).toEqual(["run_apr24", "run_apr25"]);
  });

  it("excludes runs that are older than the most recent published run", () => {
    const runs = [
      makeRun({ id: "run_apr25", status: "published", createdAt: "2026-04-25T08:10:00.000Z" }),
      makeRun({ id: "run_apr24", status: "completed", createdAt: "2026-04-24T08:10:00.000Z" }),
      makeRun({ id: "run_apr23", status: "completed", createdAt: "2026-04-23T08:10:00.000Z" }),
    ];

    expect(findUnpublishedCompleteRuns(runs, since)).toEqual([]);
  });

  it("excludes runs that are older than the most recent replayed run (preserves intentional replays)", () => {
    const runs = [
      makeRun({ id: "run_replay", status: "replayed", createdAt: "2026-04-25T12:00:00.000Z" }),
      makeRun({ id: "run_apr24", status: "completed", createdAt: "2026-04-24T08:10:00.000Z" }),
    ];

    expect(findUnpublishedCompleteRuns(runs, since)).toEqual([]);
  });

  it("excludes runs whose qualityState is not complete", () => {
    const runs = [
      makeRun({ id: "run_partial", status: "completed", qualityState: "partial", createdAt: "2026-04-24T08:10:00.000Z" }),
      makeRun({ id: "run_complete", status: "completed", qualityState: "complete", createdAt: "2026-04-24T09:10:00.000Z" }),
    ];

    expect(findUnpublishedCompleteRuns(runs, since).map((r) => r.id)).toEqual(["run_complete"]);
  });

  it("excludes runs older than the lookback window", () => {
    const runs = [
      makeRun({ id: "run_recent", status: "completed", createdAt: "2026-04-24T08:10:00.000Z" }),
      makeRun({ id: "run_old", status: "completed", createdAt: "2026-04-20T08:10:00.000Z" }),
    ];

    expect(findUnpublishedCompleteRuns(runs, since).map((r) => r.id)).toEqual(["run_recent"]);
  });

  it("includes runs created after a publication that itself is within the window", () => {
    const runs = [
      makeRun({ id: "run_apr25", status: "completed", createdAt: "2026-04-25T08:10:00.000Z" }),
      makeRun({ id: "run_apr23", status: "published", createdAt: "2026-04-23T08:10:00.000Z" }),
      makeRun({ id: "run_apr22", status: "completed", createdAt: "2026-04-22T08:10:00.000Z" }),
    ];

    expect(findUnpublishedCompleteRuns(runs, since).map((r) => r.id)).toEqual(["run_apr25"]);
  });

  it("returns empty when no runs match", () => {
    expect(findUnpublishedCompleteRuns([], since)).toEqual([]);
  });
});
