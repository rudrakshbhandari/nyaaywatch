import { describe, expect, it } from "vitest";

import type { HighCourtPublishedSnapshot } from "../src/domain/high-court-snapshot-schema.js";
import { buildHighCourtSnapshotCandidate, materializeHighCourtPublishedSnapshot } from "../src/normalize/high-court-snapshot-candidate.js";

const PREVIOUS_HIGH_COURT_SNAPSHOT: HighCourtPublishedSnapshot = {
  snapshot: {
    courtTier: "high_court",
    courtCode: "MPHC",
    courtSlug: "madhya-pradesh",
    courtName: "High Court of Madhya Pradesh",
    coveredGeographies: [
      { geographyCode: "MP", geographyName: "Madhya Pradesh", geographyType: "state", lowerCourtStateCode: "MP" },
    ],
    sourceName: "HC NJDG High Court of Madhya Pradesh dashboard",
    sourceSnapshotAt: "2026-05-30T00:00:00.000Z",
    referenceDateAt: "2026-05-30T00:00:00.000Z",
    referenceDateKind: "source_snapshot_at",
    publishedAt: "2026-05-30T03:00:00.000Z",
    methodologyVersion: "2026.04-high-court-draft",
    qualityState: "complete",
    freshnessDays: 0,
    sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Madhya Pradesh",
    publishedFromRunId: "run_mphc_prev",
  },
  stats: {
    pendingCivilCases: 80000,
    pendingCriminalCases: 12000,
    pendingTotalCases: 92000,
    institutedLastMonthCivilCases: 5000,
    institutedLastMonthCriminalCases: 900,
    institutedLastMonthTotalCases: 5900,
    disposedLastMonthCivilCases: 4800,
    disposedLastMonthCriminalCases: 850,
    disposedLastMonthTotalCases: 5650,
  },
  ageBuckets: {
    lessThanOneYear: 20000,
    oneToThreeYears: 18000,
    threeToFiveYears: 12000,
    fiveToTenYears: 25000,
    aboveTenYears: 17000,
  },
  trends: [
    {
      referenceDateAt: "2026-05-30T00:00:00.000Z",
      referenceDateKind: "source_snapshot_at",
      pendingTotalCases: 92000,
      institutedLastMonthTotalCases: 5900,
      disposedLastMonthTotalCases: 5650,
    },
  ],
};

function buildRecomputingMphcExtract(sourceSnapshotAt = "2026-06-02T00:00:00.000Z") {
  return {
    capturedAt: sourceSnapshotAt,
    courtCode: "MPHC",
    courtSlug: "madhya-pradesh",
    courtName: "High Court of Madhya Pradesh",
    coveredGeographies: [
      { geographyCode: "MP", geographyName: "Madhya Pradesh", geographyType: "state", lowerCourtStateCode: "MP" } as const,
    ],
    sourceName: "HC NJDG High Court of Madhya Pradesh dashboard",
    sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Madhya Pradesh",
    sourceSnapshotAt,
    benchOptions: [{ benchCode: "1", benchName: "Principal Bench" }],
    pendingCases: { civilCases: 81000, criminalCases: 12500, totalCases: 93500 },
    institutedLastMonth: null,
    disposedLastMonth: { civilCases: 4900, criminalCases: 870, totalCases: 5770 },
    ageBucketTotals: {
      lessThanOneYear: 20500,
      oneToThreeYears: 18200,
      threeToFiveYears: 12100,
      fiveToTenYears: 25200,
      aboveTenYears: 17100,
    },
    caseTypes: ["Writ Petition", "Second Appeal"],
  };
}

describe("buildHighCourtSnapshotCandidate", () => {
  it("falls back to captured_at when the official High Court source does not expose a source snapshot date", () => {
    const candidate = buildHighCourtSnapshotCandidate(
      {
        capturedAt: "2026-04-18T12:30:00.000Z",
        courtCode: "HPHC",
        courtSlug: "himachal",
        courtName: "High Court of Himachal Pradesh",
        coveredGeographies: [
          {
            geographyCode: "HP",
            geographyName: "Himachal Pradesh",
            geographyType: "state",
            lowerCourtStateCode: "HP",
          },
        ],
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
    expect(candidate.snapshot.coveredGeographies[0]?.geographyCode).toBe("HP");
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
        courtSlug: "himachal",
        courtName: "High Court of Himachal Pradesh",
        coveredGeographies: [
          {
            geographyCode: "HP",
            geographyName: "Himachal Pradesh",
            geographyType: "state",
            lowerCourtStateCode: "HP",
          },
        ],
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

  it("carries the prior published monthly metric forward when the source has not republished it yet", () => {
    const candidate = buildHighCourtSnapshotCandidate(buildRecomputingMphcExtract(), [PREVIOUS_HIGH_COURT_SNAPSHOT]);

    // Instituted-in-last-month was deferred by the source (null), so it carries forward
    // from the most recent published snapshot instead of failing the whole run.
    expect(candidate.stats.institutedLastMonthCivilCases).toBe(5000);
    expect(candidate.stats.institutedLastMonthCriminalCases).toBe(900);
    expect(candidate.stats.institutedLastMonthTotalCases).toBe(5900);
    // Freshly-parsed metrics still come from the new capture.
    expect(candidate.stats.disposedLastMonthTotalCases).toBe(5770);
    expect(candidate.stats.pendingTotalCases).toBe(93500);
    // The run stays publishable so cadence is preserved and the fetch-lag alarm clears.
    expect(candidate.snapshot.qualityState).toBe("complete");
    // The carried-forward total flows into the trend series too.
    expect(candidate.trends.at(-1)).toEqual({
      referenceDateAt: "2026-06-02T00:00:00.000Z",
      referenceDateKind: "source_snapshot_at",
      pendingTotalCases: 93500,
      institutedLastMonthTotalCases: 5900,
      disposedLastMonthTotalCases: 5770,
    });
  });

  it("fails when a monthly metric is missing and there is no prior snapshot to carry forward", () => {
    expect(() => buildHighCourtSnapshotCandidate(buildRecomputingMphcExtract(), [])).toThrow(
      "Cannot carry forward instituted in last month for MPHC",
    );
  });

  it("bounds carry-forward to the reference date so replaying an older capture cannot inherit newer values", () => {
    // Replaying a 2026-05-31 raw artifact whose monthly tile was recomputing, with a
    // NEWER (June 1) publication already on record. Carry-forward must use the May 30
    // snapshot active as of the replayed date, not the June 1 value — otherwise replay
    // is no longer reproducible against its stored evidence.
    const newerJuneSnapshot: HighCourtPublishedSnapshot = {
      ...PREVIOUS_HIGH_COURT_SNAPSHOT,
      snapshot: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.snapshot,
        sourceSnapshotAt: "2026-06-01T00:00:00.000Z",
        referenceDateAt: "2026-06-01T00:00:00.000Z",
        publishedAt: "2026-06-01T03:00:00.000Z",
        publishedFromRunId: "run_mphc_june",
      },
      stats: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.stats,
        institutedLastMonthCivilCases: 9100,
        institutedLastMonthCriminalCases: 1900,
        institutedLastMonthTotalCases: 11000,
      },
    };

    // loadHistoricalSnapshots returns publication-recency order, so the newer June
    // publication leads the list; the date bound must still skip it for a May 31 replay.
    const candidate = buildHighCourtSnapshotCandidate(buildRecomputingMphcExtract("2026-05-31T00:00:00.000Z"), [
      newerJuneSnapshot, // referenceDateAt 2026-06-01 — most recent publication, must be skipped
      PREVIOUS_HIGH_COURT_SNAPSHOT, // referenceDateAt 2026-05-30 — active as of the replayed date
    ]);

    expect(candidate.snapshot.referenceDateAt).toBe("2026-05-31T00:00:00.000Z");
    // Carries the May 30 value (5900), never the June 1 value (11000).
    expect(candidate.stats.institutedLastMonthTotalCases).toBe(5900);
  });

  it("honors rollback publication order: a rolled-back-to snapshot wins over a later-published correction", () => {
    // Sequence: publish A (May 30), publish corrected B (same date, later publishedAt),
    // then roll back to A. The rollback is the newest publication event, so
    // loadHistoricalSnapshots returns A first (recency order). Carry-forward must use A,
    // not B — ranking by the snapshot's own publishedAt would wrongly resurrect the
    // rolled-back B. (Regression for #307.)
    const rolledBackToA: HighCourtPublishedSnapshot = {
      ...PREVIOUS_HIGH_COURT_SNAPSHOT,
      snapshot: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.snapshot,
        publishedAt: "2026-05-30T03:00:00.000Z", // earlier publishedAt, but the active target after rollback
        publishedFromRunId: "run_mphc_A",
      },
      stats: { ...PREVIOUS_HIGH_COURT_SNAPSHOT.stats, institutedLastMonthTotalCases: 5900 },
    };
    const rolledBackCorrectionB: HighCourtPublishedSnapshot = {
      ...PREVIOUS_HIGH_COURT_SNAPSHOT,
      snapshot: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.snapshot,
        publishedAt: "2026-05-30T09:00:00.000Z", // later publishedAt, but rolled back
        publishedFromRunId: "run_mphc_B",
      },
      stats: { ...PREVIOUS_HIGH_COURT_SNAPSHOT.stats, institutedLastMonthTotalCases: 6400 },
    };

    const candidate = buildHighCourtSnapshotCandidate(buildRecomputingMphcExtract("2026-06-02T00:00:00.000Z"), [
      rolledBackToA, // active after rollback → leads the recency-ordered list
      rolledBackCorrectionB, // later publishedAt but superseded by the rollback
    ]);

    expect(candidate.stats.institutedLastMonthTotalCases).toBe(5900);
  });

  it("carries the latest period forward, not a more-recently-published older replay", () => {
    // June 1 is published (active), then a May 31 capture is replayed — the replay is the
    // newest publication event, so it leads the recency-ordered list. A June 3 recompute
    // run must still carry forward the June 1 value (the most recent period on or before
    // June 3), not the May 31 replay. (Regression for the #307 review follow-up.)
    const june1: HighCourtPublishedSnapshot = {
      ...PREVIOUS_HIGH_COURT_SNAPSHOT,
      snapshot: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.snapshot,
        sourceSnapshotAt: "2026-06-01T00:00:00.000Z",
        referenceDateAt: "2026-06-01T00:00:00.000Z",
        publishedAt: "2026-06-01T03:00:00.000Z",
        publishedFromRunId: "run_mphc_june1",
      },
      stats: { ...PREVIOUS_HIGH_COURT_SNAPSHOT.stats, institutedLastMonthTotalCases: 12000 },
    };
    const may31Replay: HighCourtPublishedSnapshot = {
      ...PREVIOUS_HIGH_COURT_SNAPSHOT,
      snapshot: {
        ...PREVIOUS_HIGH_COURT_SNAPSHOT.snapshot,
        sourceSnapshotAt: "2026-05-31T00:00:00.000Z",
        referenceDateAt: "2026-05-31T00:00:00.000Z",
        publishedAt: "2026-06-02T12:00:00.000Z", // replayed/published most recently
        publishedFromRunId: "run_mphc_may31_replay",
      },
      stats: { ...PREVIOUS_HIGH_COURT_SNAPSHOT.stats, institutedLastMonthTotalCases: 8000 },
    };

    const candidate = buildHighCourtSnapshotCandidate(buildRecomputingMphcExtract("2026-06-03T00:00:00.000Z"), [
      may31Replay, // newest publication event → leads the list, but older period
      june1, // most recent period on or before June 3 → must be carried forward
    ]);

    expect(candidate.stats.institutedLastMonthTotalCases).toBe(12000);
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
          coveredGeographies: [
            {
              geographyCode: "HP",
              geographyName: "Himachal Pradesh",
              geographyType: "state",
              lowerCourtStateCode: "HP",
            },
          ],
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
