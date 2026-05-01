import { describe, expect, it } from "vitest";

import { buildSnapshotCandidate } from "../src/normalize/snapshot-candidate.js";

describe("snapshot candidate normalization", () => {
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
  });
});
