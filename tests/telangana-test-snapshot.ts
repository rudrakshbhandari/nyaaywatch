import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";

export function buildTelanganaTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "TS",
      stateName: "Telangana",
      sourceName: "NJDG Telangana district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-17T23:58:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Telangana",
      publishedFromRunId: "run_b48f6632-d59e-4bf9-9cdf-30125e045538",
    },
    stats: {
      pendingCases: 984793,
      disposalRate: 124.0,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "adilabad",
        districtName: "Adilabad",
        rank: 1,
        backlogCases: 26311,
        disposalRate: 82.1,
        medianAgeDays: 183,
        filingVsDisposalGap: 17.9,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already among Telangana's biggest.",
        summary:
          "Adilabad has 26,311 cases waiting. A typical pending case falls around 183 days old, and the district cleared 82.1% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "hyderabad",
        districtName: "Hyderabad",
        rank: 2,
        backlogCases: 185904,
        disposalRate: 131.4,
        medianAgeDays: 730,
        filingVsDisposalGap: -31.4,
        flagReason:
          "People appear to be waiting longer here than in much of Telangana, based on the latest published snapshot.",
        summary:
          "Hyderabad has 1,85,904 cases waiting. A typical pending case falls around 730 days old, and the district cleared 131.4% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
      {
        districtId: "warangal",
        districtName: "Warangal",
        rank: 3,
        backlogCases: 94127,
        disposalRate: 91.2,
        medianAgeDays: 365,
        filingVsDisposalGap: 8.8,
        flagReason:
          "New cases are coming in faster than this district is clearing them, and the queue is already under visible pressure in the statewide snapshot.",
        summary:
          "Warangal has 94,127 cases waiting. A typical pending case falls around 365 days old, and the district cleared 91.2% as many cases as it received last month. It stays on the watchlist in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 984793,
        disposalRate: 124.0,
      },
    ],
  };
}
