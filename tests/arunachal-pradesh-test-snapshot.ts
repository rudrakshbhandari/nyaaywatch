import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";

export function buildArunachalPradeshTestSnapshot(): PublishedSnapshot {
  return {
    snapshot: {
      stateCode: "AR",
      stateName: "Arunachal Pradesh",
      sourceName: "NJDG Arunachal Pradesh district dashboard",
      sourceSnapshotAt: "2026-04-16T00:00:00.000Z",
      publishedAt: "2026-04-18T07:15:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "National Judicial Data Grid public district dashboard for Arunachal Pradesh",
      publishedFromRunId: "run_330e608c-890c-47e2-a585-3171c3c44c42",
    },
    stats: {
      pendingCases: 15539,
      disposalRate: 118.5,
      medianCaseAgeDays: 183,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: "lohit",
        districtName: "Lohit",
        rank: 1,
        backlogCases: 1984,
        disposalRate: 91.2,
        medianAgeDays: 183,
        filingVsDisposalGap: 8.8,
        flagReason:
          "New cases are still arriving faster than this district is clearing them, and the queue remains large for this snapshot.",
        summary:
          "Lohit has 1,984 cases waiting. A typical pending case falls around 183 days old, and the district cleared 91.2% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
      {
        districtId: "papum-pare",
        districtName: "Papum Pare",
        rank: 2,
        backlogCases: 2436,
        disposalRate: 126.7,
        medianAgeDays: 365,
        filingVsDisposalGap: -26.7,
        flagReason:
          "People appear to be waiting longer here than in much of Arunachal Pradesh, based on the latest published snapshot.",
        summary:
          "Papum Pare has 2,436 cases waiting. A typical pending case falls around 365 days old, and the district cleared 126.7% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
      {
        districtId: "changlang",
        districtName: "Changlang",
        rank: 3,
        backlogCases: 1763,
        disposalRate: 97.4,
        medianAgeDays: 183,
        filingVsDisposalGap: 2.6,
        flagReason:
          "This district still carries visible backlog pressure in the statewide snapshot even though disposal remains close to filings.",
        summary:
          "Changlang has 1,763 cases waiting. A typical pending case falls around 183 days old, and the district cleared 97.4% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.",
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-16T00:00:00.000Z",
        pendingCases: 15539,
        disposalRate: 118.5,
      },
    ],
  };
}
