import { describe, expect, it } from "vitest";

import { PublishedSnapshotSchema, type PublishedSnapshot } from "../src/domain/snapshot-schema.js";
import { buildSnapshotCandidate } from "../src/normalize/snapshot-candidate.js";
import { evaluateAutoPublish } from "../src/ops/auto-publish-gate.js";

function historySnapshot(input: {
  referenceDateAt: string;
  pendingCases: number;
  publishedAt?: string;
}): PublishedSnapshot {
  return PublishedSnapshotSchema.parse({
    snapshot: {
      stateCode: "MZ",
      stateName: "Mizoram",
      sourceName: "NJDG Mizoram district dashboard",
      sourceSnapshotAt: null,
      referenceDateAt: input.referenceDateAt,
      referenceDateKind: "captured_at",
      publishedAt: input.publishedAt ?? input.referenceDateAt,
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Mizoram",
      publishedFromRunId: `run_${input.referenceDateAt}`,
    },
    stats: {
      pendingCases: input.pendingCases,
      filedLastMonthCases: 0,
      clearedLastMonthCases: 0,
      disposalRate: 0,
      medianCaseAgeDays: 0,
      flaggedDistricts: 0,
      ageBuckets: {
        lessThanOneYear: input.pendingCases,
        oneToThreeYears: 0,
        threeToFiveYears: 0,
        fiveToTenYears: 0,
        aboveTenYears: 0,
      },
    },
    districts: [
      {
        districtId: "aizawl",
        districtName: "Aizawl",
        rank: 1,
        backlogCases: input.pendingCases,
        disposalRate: 0,
        medianAgeDays: 0,
        filingVsDisposalGap: 0,
        flagReason: "Synthetic history fixture for trend-window coverage.",
        summary: "Synthetic history fixture for trend-window coverage.",
      },
    ],
    trends: [
      {
        snapshotDate: input.referenceDateAt,
        pendingCases: input.pendingCases,
        filedLastMonthCases: 0,
        clearedLastMonthCases: 0,
        disposalRate: 0,
      },
    ],
  });
}

describe("snapshot candidate normalization", () => {
  it("falls back to captured_at when NJDG does not expose a defensible source date", () => {
    const candidate = buildSnapshotCandidate(
      {
        capturedAt: "2026-06-20T00:00:00.000Z",
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        expectedDistrictCount: 1,
        sourceName: "NJDG Himachal Pradesh district dashboard",
        sourceAttribution: "National Judicial Data Grid public district dashboard for Himachal Pradesh",
        sourceSnapshotAt: null,
        state: {
          pendingCases: 100,
          institutedLastMonth: 10,
          disposedLastMonth: 9,
          ageBuckets: {
            lessThanOneYear: 100,
            oneToThreeYears: 0,
            threeToFiveYears: 0,
            fiveToTenYears: 0,
            aboveTenYears: 0,
          },
        },
        districts: [
          {
            districtCode: "shimla",
            districtName: "Shimla",
            pendingCases: 100,
            institutedLastMonth: 10,
            disposedLastMonth: 9,
            ageBuckets: {
              lessThanOneYear: 100,
              oneToThreeYears: 0,
              threeToFiveYears: 0,
              fiveToTenYears: 0,
              aboveTenYears: 0,
            },
          },
        ],
      },
      [],
    );

    expect(candidate.snapshot.sourceSnapshotAt).toBeNull();
    expect(candidate.snapshot.referenceDateAt).toBe("2026-06-20T00:00:00.000Z");
    expect(candidate.snapshot.referenceDateKind).toBe("captured_at");
    expect(candidate.snapshot.qualityState).toBe("complete");
    expect(candidate.trends.at(-1)?.snapshotDate).toBe("2026-06-20T00:00:00.000Z");
  });

  it("does not fabricate age or pressure metrics for zero-volume snapshots", () => {
    const candidate = buildSnapshotCandidate(
      {
        capturedAt: "2026-04-18T00:00:00.000Z",
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        expectedDistrictCount: 1,
        sourceName: "NJDG Himachal Pradesh district dashboard",
        sourceAttribution: "National Judicial Data Grid public district dashboard for Himachal Pradesh",
        sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
        state: {
          pendingCases: 0,
          institutedLastMonth: 0,
          disposedLastMonth: 0,
          ageBuckets: {
            lessThanOneYear: 0,
            oneToThreeYears: 0,
            threeToFiveYears: 0,
            fiveToTenYears: 0,
            aboveTenYears: 0,
          },
        },
        districts: [
          {
            districtCode: "zero",
            districtName: "Zero District",
            pendingCases: 0,
            institutedLastMonth: 0,
            disposedLastMonth: 0,
            ageBuckets: {
              lessThanOneYear: 0,
              oneToThreeYears: 0,
              threeToFiveYears: 0,
              fiveToTenYears: 0,
              aboveTenYears: 0,
            },
          },
        ],
      },
      [],
    );

    expect(candidate.stats.medianCaseAgeDays).toBe(0);
    expect(candidate.stats.oldCaseBurden).toEqual({ state: "missing", reason: "not-applicable" });
    expect(candidate.stats.backlogMovementShare).toEqual({ state: "missing", reason: "not-applicable" });
    expect(candidate.stats.breakEvenClearancesNeeded).toEqual({ state: "ok", value: 0 });
    expect(candidate.stats.catchUpClearancesPerMonth).toEqual({ state: "missing", reason: "not-applicable" });
    expect(candidate.stats.backlogConcentration).toEqual({ state: "missing", reason: "not-applicable" });
    expect(candidate.districts[0]?.medianAgeDays).toBe(0);
    expect(candidate.districts[0]?.disposalRate).toBe(0);
    expect(candidate.districts[0]?.filingVsDisposalGap).toBe(0);
    expect(candidate.districts[0]?.flagReason).toContain("doesn't show pending-case age");
    expect(candidate.districts[0]?.summary).toContain("has no pending cases");
    expect(candidate.districts[0]?.summary).not.toContain("183 days old");
  });

  it("preserves valid zero monthly movement for state pressure metrics", () => {
    const candidate = buildSnapshotCandidate(
      {
        capturedAt: "2026-04-18T00:00:00.000Z",
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        expectedDistrictCount: 1,
        sourceName: "NJDG Himachal Pradesh district dashboard",
        sourceAttribution: "National Judicial Data Grid public district dashboard for Himachal Pradesh",
        sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
        state: {
          pendingCases: 10,
          institutedLastMonth: 0,
          disposedLastMonth: 0,
          ageBuckets: {
            lessThanOneYear: 10,
            oneToThreeYears: 0,
            threeToFiveYears: 0,
            fiveToTenYears: 0,
            aboveTenYears: 0,
          },
        },
        districts: [
          {
            districtCode: "quiet",
            districtName: "Quiet District",
            pendingCases: 10,
            institutedLastMonth: 0,
            disposedLastMonth: 0,
            ageBuckets: {
              lessThanOneYear: 10,
              oneToThreeYears: 0,
              threeToFiveYears: 0,
              fiveToTenYears: 0,
              aboveTenYears: 0,
            },
          },
        ],
      },
      [],
    );

    expect(candidate.stats.oldCaseBurden).toEqual({
      state: "ok",
      value: {
        threePlusYearsCases: 0,
        fivePlusYearsCases: 0,
        tenPlusYearsCases: 0,
        threePlusYearsShare: 0,
        fivePlusYearsShare: 0,
        tenPlusYearsShare: 0,
      },
    });
    expect(candidate.stats.backlogMovementShare).toEqual({ state: "ok", value: 0 });
    expect(candidate.stats.breakEvenClearancesNeeded).toEqual({ state: "ok", value: 0 });
    expect(candidate.stats.catchUpClearancesPerMonth).toEqual({ state: "ok", value: 1 });
    expect(candidate.districts[0]?.summary).toContain("NJDG reports 0 filed and 0 cleared cases");
    expect(candidate.districts[0]?.summary).toContain("clearance pace as N/A");
    expect(candidate.districts[0]?.summary).not.toContain("cleared 0.0%");
    expect(candidate.districts[0]?.flagReason).toContain("monthly clearance signal is unavailable");
  });

  it("keeps the most recent published pending values in the trend window used by auto-publish", () => {
    // Reproduce the MZ/GJ gate failure mode: several older April points plus a
    // recent July publish, then a new July candidate. The window must end with
    // [..., recentPublish, current], not [..., oldestApril, current].
    const previousSnapshots = [
      historySnapshot({ referenceDateAt: "2026-04-16T00:00:00.000Z", pendingCases: 7677 }),
      historySnapshot({ referenceDateAt: "2026-04-19T00:00:00.000Z", pendingCases: 7677 }),
      historySnapshot({ referenceDateAt: "2026-04-20T00:00:00.000Z", pendingCases: 7655 }),
      historySnapshot({ referenceDateAt: "2026-04-22T00:00:00.000Z", pendingCases: 7739 }),
      historySnapshot({ referenceDateAt: "2026-07-08T02:44:02.606Z", pendingCases: 8063 }),
    ];

    const candidate = buildSnapshotCandidate(
      {
        capturedAt: "2026-07-12T02:44:58.175Z",
        stateCode: "MZ",
        stateName: "Mizoram",
        expectedDistrictCount: 1,
        sourceName: "NJDG Mizoram district dashboard",
        sourceAttribution: "National Judicial Data Grid public district dashboard for Mizoram",
        sourceSnapshotAt: null,
        state: {
          pendingCases: 9619,
          institutedLastMonth: 968,
          disposedLastMonth: 814,
          ageBuckets: {
            lessThanOneYear: 5000,
            oneToThreeYears: 3000,
            threeToFiveYears: 1000,
            fiveToTenYears: 600,
            aboveTenYears: 19,
          },
        },
        districts: [
          {
            districtCode: "aizawl",
            districtName: "Aizawl",
            pendingCases: 9619,
            institutedLastMonth: 968,
            disposedLastMonth: 814,
            ageBuckets: {
              lessThanOneYear: 5000,
              oneToThreeYears: 3000,
              threeToFiveYears: 1000,
              fiveToTenYears: 600,
              aboveTenYears: 19,
            },
          },
        ],
      },
      previousSnapshots,
    );

    expect(candidate.trends.map((point) => point.pendingCases)).toEqual([7677, 7655, 7739, 8063, 9619]);
    expect(candidate.trends.at(-2)?.pendingCases).toBe(8063);

    const decision = evaluateAutoPublish({
      qualityState: candidate.snapshot.qualityState,
      currentPending: candidate.stats.pendingCases,
      previousPending: candidate.trends.at(-2)?.pendingCases,
    });
    expect(decision.publish).toBe(true);
    expect(decision.deltaFraction).toBeCloseTo(0.193, 3);
  });
});
