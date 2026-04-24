import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";

export function buildAndhraPradeshTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "AP",
      stateName: "Andhra Pradesh",
      sourceName: "NJDG Andhra Pradesh district dashboard",
      sourceSnapshotAt: "2026-04-17T00:00:00.000Z",
      publishedAt: "2026-04-18T07:00:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Andhra Pradesh",
      publishedFromRunId: "run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef",
    },
    stats: {
      pendingCases: 929470,
      disposalRate: 111.4,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "ananthapur",
        districtName: "Ananthapur",
        rank: 1,
        backlogCases: 65418,
        disposalRate: 94.6,
        medianAgeDays: 183,
        filingVsDisposalGap: 5.4,
        flagReason:
          "New cases are still arriving faster than this district is clearing them, and the queue is already among Andhra Pradesh's largest.",
        summary:
          "Ananthapur has 65,418 cases waiting. A typical pending case falls around 183 days old, and the district cleared 94.6% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
      {
        districtId: "guntur",
        districtName: "Guntur",
        rank: 2,
        backlogCases: 81207,
        disposalRate: 118.9,
        medianAgeDays: 365,
        filingVsDisposalGap: -18.9,
        flagReason:
          "People appear to be waiting longer here than in much of Andhra Pradesh.",
        summary:
          "Guntur has 81,207 cases waiting. A typical pending case falls around 365 days old, and the district cleared 118.9% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
      {
        districtId: "visakhapatnam",
        districtName: "Visakhapatnam",
        rank: 3,
        backlogCases: 73112,
        disposalRate: 97.8,
        medianAgeDays: 183,
        filingVsDisposalGap: 2.2,
        flagReason:
          "This district still carries visible backlog pressure in the statewide snapshot even though disposal remains close to filings.",
        summary:
          "Visakhapatnam has 73,112 cases waiting. A typical pending case falls around 183 days old, and the district cleared 97.8% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-17T00:00:00.000Z",
        pendingCases: 929470,
        disposalRate: 111.4,
      },
    ],
  };
}
