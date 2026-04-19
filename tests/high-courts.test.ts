import { describe, expect, it } from "vitest";

import { buildPublicHighCourtRoutes } from "../src/api/public-high-court.js";
import { HighCourtPublishedSnapshotSchema } from "../src/domain/high-court-snapshot-schema.js";
import { HighCourtSnapshotCandidateSchema } from "../src/domain/high-court-snapshot-candidate-schema.js";
import { getHighCourtProfile, getHighCourtProfileBySlug, listHighCourtProfiles } from "../src/high-courts.js";

describe("high court profiles", () => {
  it("defines Himachal High Court as the first pilot profile with official source URLs", () => {
    expect(getHighCourtProfile("HPHC")).toEqual({
      courtCode: "HPHC",
      courtSlug: "himachal",
      courtName: "High Court of Himachal Pradesh",
      stateCode: "HP",
      stateName: "Himachal Pradesh",
      hcNjdgStateValue: "2~5",
      publicBeta: false,
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://hphighcourt.nic.in/",
        sitemap: "https://hphighcourt.nic.in/sitemap.html",
        annualReport2023_24: "https://hphighcourt.nic.in/pdf/AnnualReport23092024.pdf",
      },
    });
  });

  it("resolves high court profiles by slug", () => {
    expect(getHighCourtProfileBySlug("himachal")?.courtCode).toBe("HPHC");
    expect(getHighCourtProfileBySlug("HIMACHAL")?.courtCode).toBe("HPHC");
    expect(getHighCourtProfileBySlug("unknown")).toBeNull();
    expect(listHighCourtProfiles()).toHaveLength(1);
  });
});

describe("high court routes", () => {
  it("builds the reserved public route namespace for the Himachal High Court pilot", () => {
    const routes = buildPublicHighCourtRoutes(getHighCourtProfile("HPHC"));

    expect(routes).toEqual({
      index: "/high-courts",
      home: "/high-courts/himachal",
      methodology: "/high-courts/himachal/methodology",
      api: "/high-courts/himachal/api",
      data: "/high-courts/himachal/data",
      statsApi: "/v1/high-courts/himachal/stats",
      trendsApi: "/v1/high-courts/himachal/trends",
    });
  });
});

describe("high court snapshot schemas", () => {
  const candidatePayload = {
    snapshot: {
      courtTier: "high_court",
      courtCode: "HPHC",
      courtSlug: "himachal",
      courtName: "High Court of Himachal Pradesh",
      stateCode: "HP",
      stateName: "Himachal Pradesh",
      sourceName: "HC NJDG Himachal High Court dashboard",
      sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
      methodologyVersion: "2026.04-high-court-draft",
      qualityState: "complete",
      sourceAttribution: "High Courts of India NJDG for the High Court of Himachal Pradesh",
    },
    stats: {
      pendingCivilCases: 12000,
      pendingCriminalCases: 4500,
      pendingTotalCases: 16500,
      institutedLastMonthCivilCases: 500,
      institutedLastMonthCriminalCases: 200,
      institutedLastMonthTotalCases: 700,
      disposedLastMonthCivilCases: 520,
      disposedLastMonthCriminalCases: 180,
      disposedLastMonthTotalCases: 700,
    },
    ageBuckets: {
      lessThanOneYear: 3000,
      oneToThreeYears: 4200,
      threeToFiveYears: 2800,
      fiveToTenYears: 3500,
      aboveTenYears: 3000,
    },
    caseTypeBreakdown: [
      {
        caseType: "Writ Petition",
        civilCases: 5000,
        criminalCases: 100,
        totalCases: 5100,
      },
    ],
    trends: [
      {
        snapshotDate: "2026-04-18T00:00:00.000Z",
        pendingTotalCases: 16500,
        institutedLastMonthTotalCases: 700,
        disposedLastMonthTotalCases: 700,
      },
    ],
  };

  it("parses the High Court snapshot candidate contract", () => {
    expect(HighCourtSnapshotCandidateSchema.parse(candidatePayload)).toEqual(candidatePayload);
  });

  it("parses the published High Court snapshot contract", () => {
    const publishedPayload = {
      ...candidatePayload,
      snapshot: {
        ...candidatePayload.snapshot,
        publishedAt: "2026-04-18T09:00:00.000Z",
        freshnessDays: 0,
        publishedFromRunId: "run_high_court_hp_1",
      },
    };

    expect(HighCourtPublishedSnapshotSchema.parse(publishedPayload)).toEqual(publishedPayload);
  });
});
