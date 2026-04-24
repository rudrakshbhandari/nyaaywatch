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
    expect(candidate.districts[0]?.medianAgeDays).toBe(0);
    expect(candidate.districts[0]?.disposalRate).toBe(0);
    expect(candidate.districts[0]?.filingVsDisposalGap).toBe(0);
    expect(candidate.districts[0]?.flagReason).toContain("doesn't show pending-case age");
    expect(candidate.districts[0]?.summary).toContain("has no pending cases");
    expect(candidate.districts[0]?.summary).not.toContain("183 days old");
  });
});
