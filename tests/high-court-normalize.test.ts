import { describe, expect, it } from "vitest";

import { buildHighCourtSnapshotCandidate, materializeHighCourtPublishedSnapshot } from "../src/normalize/high-court-snapshot-candidate.js";

describe("buildHighCourtSnapshotCandidate", () => {
  it("falls back to captured_at when the official High Court source does not expose a source snapshot date", () => {
    const candidate = buildHighCourtSnapshotCandidate(
      {
        capturedAt: "2026-04-18T12:30:00.000Z",
        courtCode: "HPHC",
        courtName: "High Court of Himachal Pradesh",
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        sourceName: "HC NJDG High Court of Himachal Pradesh dashboard",
        sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Himachal Pradesh",
        sourceSnapshotAt: null,
        benchOptions: [{ benchCode: "1", benchName: "Principal Bench Himachal P" }],
        pendingCases: {
          civilCases: 91881,
          criminalCases: 13718,
          totalCases: 105599,
        },
        institutedLastMonth: {
          civilCases: 6021,
          criminalCases: 1025,
          totalCases: 7046,
        },
        disposedLastMonth: {
          civilCases: 5552,
          criminalCases: 976,
          totalCases: 6528,
        },
        ageBucketTotals: {
          lessThanOneYear: 31279,
          oneToThreeYears: 22071,
          threeToFiveYears: 13093,
          fiveToTenYears: 31406,
          aboveTenYears: 7750,
        },
        caseTypes: ["Writ Petition", "Second Appeal"],
      },
      [],
    );

    expect(candidate.snapshot.sourceSnapshotAt).toBeNull();
    expect(candidate.snapshot.referenceDateAt).toBe("2026-04-18T12:30:00.000Z");
    expect(candidate.snapshot.referenceDateKind).toBe("captured_at");
    expect(candidate.stats.pendingTotalCases).toBe(105599);
    expect(candidate.trends).toEqual([
      {
        referenceDateAt: "2026-04-18T12:30:00.000Z",
        referenceDateKind: "captured_at",
        pendingTotalCases: 105599,
        institutedLastMonthTotalCases: 7046,
        disposedLastMonthTotalCases: 6528,
      },
    ]);
  });

  it("preserves a real source snapshot date when the source exposes one", () => {
    const candidate = buildHighCourtSnapshotCandidate(
      {
        capturedAt: "2026-04-18T12:30:00.000Z",
        courtCode: "HPHC",
        courtName: "High Court of Himachal Pradesh",
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        sourceName: "HC NJDG High Court of Himachal Pradesh dashboard",
        sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Himachal Pradesh",
        sourceSnapshotAt: "2026-04-17T00:00:00.000Z",
        benchOptions: [{ benchCode: "1", benchName: "Principal Bench Himachal P" }],
        pendingCases: {
          civilCases: 91881,
          criminalCases: 13718,
          totalCases: 105599,
        },
        institutedLastMonth: {
          civilCases: 6021,
          criminalCases: 1025,
          totalCases: 7046,
        },
        disposedLastMonth: {
          civilCases: 5552,
          criminalCases: 976,
          totalCases: 6528,
        },
        ageBucketTotals: {
          lessThanOneYear: 31279,
          oneToThreeYears: 22071,
          threeToFiveYears: 13093,
          fiveToTenYears: 31406,
          aboveTenYears: 7750,
        },
        caseTypes: ["Writ Petition", "Second Appeal"],
      },
      [],
    );

    expect(candidate.snapshot.sourceSnapshotAt).toBe("2026-04-17T00:00:00.000Z");
    expect(candidate.snapshot.referenceDateAt).toBe("2026-04-17T00:00:00.000Z");
    expect(candidate.snapshot.referenceDateKind).toBe("source_snapshot_at");
  });
});

describe("materializeHighCourtPublishedSnapshot", () => {
  it("computes freshness from the explicit reference date instead of assuming a source snapshot date exists", () => {
    const published = materializeHighCourtPublishedSnapshot(
      {
        snapshot: {
          courtTier: "high_court",
          courtCode: "HPHC",
          courtSlug: "himachal",
          courtName: "High Court of Himachal Pradesh",
          stateCode: "HP",
          stateName: "Himachal Pradesh",
          sourceName: "HC NJDG High Court of Himachal Pradesh dashboard",
          sourceSnapshotAt: null,
          referenceDateAt: "2026-04-18T12:30:00.000Z",
          referenceDateKind: "captured_at",
          methodologyVersion: "2026.04-high-court-draft",
          qualityState: "complete",
          sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Himachal Pradesh",
        },
        stats: {
          pendingCivilCases: 91881,
          pendingCriminalCases: 13718,
          pendingTotalCases: 105599,
          institutedLastMonthCivilCases: 6021,
          institutedLastMonthCriminalCases: 1025,
          institutedLastMonthTotalCases: 7046,
          disposedLastMonthCivilCases: 5552,
          disposedLastMonthCriminalCases: 976,
          disposedLastMonthTotalCases: 6528,
        },
        ageBuckets: {
          lessThanOneYear: 31279,
          oneToThreeYears: 22071,
          threeToFiveYears: 13093,
          fiveToTenYears: 31406,
          aboveTenYears: 7750,
        },
        trends: [
          {
            referenceDateAt: "2026-04-18T12:30:00.000Z",
            referenceDateKind: "captured_at",
            pendingTotalCases: 105599,
            institutedLastMonthTotalCases: 7046,
            disposedLastMonthTotalCases: 6528,
          },
        ],
      },
      "2026-04-20T12:30:00.000Z",
      "run_high_court_hp_1",
    );

    expect(published.snapshot.freshnessDays).toBe(2);
    expect(published.snapshot.publishedFromRunId).toBe("run_high_court_hp_1");
    expect(published.snapshot.sourceSnapshotAt).toBeNull();
    expect(published.snapshot.referenceDateKind).toBe("captured_at");
  });
});
