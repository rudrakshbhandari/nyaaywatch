import { describe, expect, it } from "vitest";

import type { HighCourtPublishedSnapshot } from "../src/domain/high-court-snapshot-schema.js";
import { getHighCourtProfile } from "../src/high-courts.js";
import { compareHighCourtPressure } from "../src/api/home/national-view-model.js";

function buildHighCourtSnapshot(
  courtCode: "HPHC" | "APHC" | "BOHC",
  stats: {
    pendingTotalCases: number;
    institutedLastMonthTotalCases: number;
    disposedLastMonthTotalCases: number;
  },
): HighCourtPublishedSnapshot {
  const profile = getHighCourtProfile(courtCode);

  return {
    snapshot: {
      courtTier: "high_court",
      courtCode: profile.courtCode,
      courtSlug: profile.courtSlug,
      courtName: profile.courtName,
      coveredGeographies: profile.coveredGeographies,
      sourceName: `HC NJDG ${profile.courtName} dashboard`,
      sourceSnapshotAt: null,
      referenceDateAt: "2026-04-19T00:00:00.000Z",
      referenceDateKind: "captured_at",
      publishedAt: "2026-04-20T00:00:00.000Z",
      methodologyVersion: "2026.04-high-court-draft",
      qualityState: "complete",
      freshnessDays: 1,
      sourceAttribution: `High Courts of India National Judicial Data Grid for ${profile.courtName}`,
    },
    stats: {
      pendingCivilCases: Math.max(stats.pendingTotalCases - 1000, 0),
      pendingCriminalCases: Math.min(stats.pendingTotalCases, 1000),
      pendingTotalCases: stats.pendingTotalCases,
      institutedLastMonthCivilCases: Math.max(stats.institutedLastMonthTotalCases - 100, 0),
      institutedLastMonthCriminalCases: Math.min(stats.institutedLastMonthTotalCases, 100),
      institutedLastMonthTotalCases: stats.institutedLastMonthTotalCases,
      disposedLastMonthCivilCases: Math.max(stats.disposedLastMonthTotalCases - 100, 0),
      disposedLastMonthCriminalCases: Math.min(stats.disposedLastMonthTotalCases, 100),
      disposedLastMonthTotalCases: stats.disposedLastMonthTotalCases,
    },
    ageBuckets: {
      lessThanOneYear: 1,
      oneToThreeYears: 1,
      threeToFiveYears: 1,
      fiveToTenYears: 1,
      aboveTenYears: 1,
    },
    trends: [
      {
        referenceDateAt: "2026-04-19T00:00:00.000Z",
        referenceDateKind: "captured_at",
        pendingTotalCases: stats.pendingTotalCases,
        institutedLastMonthTotalCases: stats.institutedLastMonthTotalCases,
        disposedLastMonthTotalCases: stats.disposedLastMonthTotalCases,
      },
    ],
  };
}

describe("compareHighCourtPressure", () => {
  it("puts the clearest worsening pile-growth signal first", () => {
    const himachal = {
      profile: getHighCourtProfile("HPHC"),
      snapshot: buildHighCourtSnapshot("HPHC", {
        pendingTotalCases: 105_599,
        institutedLastMonthTotalCases: 7_046,
        disposedLastMonthTotalCases: 6_528,
      }),
    };
    const andhra = {
      profile: getHighCourtProfile("APHC"),
      snapshot: buildHighCourtSnapshot("APHC", {
        pendingTotalCases: 249_000,
        institutedLastMonthTotalCases: 6_200,
        disposedLastMonthTotalCases: 5_000,
      }),
    };
    const bombay = {
      profile: getHighCourtProfile("BOHC"),
      snapshot: buildHighCourtSnapshot("BOHC", {
        pendingTotalCases: 649_000,
        institutedLastMonthTotalCases: 10_000,
        disposedLastMonthTotalCases: 10_200,
      }),
    };

    const ordered = [himachal, bombay, andhra].sort(compareHighCourtPressure);
    expect(ordered.map((entry) => entry.profile.courtCode)).toEqual(["APHC", "HPHC", "BOHC"]);
  });

  it("breaks ties by lower clearance first, then larger pending load", () => {
    const himachal = {
      profile: getHighCourtProfile("HPHC"),
      snapshot: buildHighCourtSnapshot("HPHC", {
        pendingTotalCases: 105_599,
        institutedLastMonthTotalCases: 7_000,
        disposedLastMonthTotalCases: 6_000,
      }),
    };
    const andhra = {
      profile: getHighCourtProfile("APHC"),
      snapshot: buildHighCourtSnapshot("APHC", {
        pendingTotalCases: 249_000,
        institutedLastMonthTotalCases: 7_000,
        disposedLastMonthTotalCases: 6_300,
      }),
    };
    const bombay = {
      profile: getHighCourtProfile("BOHC"),
      snapshot: buildHighCourtSnapshot("BOHC", {
        pendingTotalCases: 649_000,
        institutedLastMonthTotalCases: 7_000,
        disposedLastMonthTotalCases: 6_300,
      }),
    };

    const ordered = [andhra, bombay, himachal].sort(compareHighCourtPressure);
    expect(ordered.map((entry) => entry.profile.courtCode)).toEqual(["HPHC", "BOHC", "APHC"]);
  });
});
