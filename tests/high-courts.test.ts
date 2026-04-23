import { describe, expect, it } from "vitest";

import {
  buildHighCourtCoverageSentence,
  buildPublicHighCourtRoutes,
  formatHighCourtCoverageLabel,
} from "../src/api/public-high-court.js";
import { HighCourtCaptureBundleSchema } from "../src/domain/high-court-capture-schema.js";
import { HighCourtPublishedSnapshotSchema } from "../src/domain/high-court-snapshot-schema.js";
import { HighCourtSnapshotCandidateSchema } from "../src/domain/high-court-snapshot-candidate-schema.js";
import {
  getHighCourtProfile,
  getHighCourtProfileBySlug,
  getPrimaryHighCourtStateCode,
  listHighCourtProfiles,
  listPublicHighCourtProfiles,
} from "../src/high-courts.js";

describe("high court profiles", () => {
  it("defines the currently public High Court beta profiles with reviewed source metadata", () => {
    expect(getHighCourtProfile("HPHC")).toEqual({
      courtCode: "HPHC",
      courtSlug: "himachal",
      courtName: "High Court of Himachal Pradesh",
      hcNjdgStateValue: "2~5",
      coveredGeographies: [
        {
          geographyCode: "HP",
          geographyName: "Himachal Pradesh",
          geographyType: "state",
          lowerCourtStateCode: "HP",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://hphighcourt.nic.in/",
        sitemap: "https://hphighcourt.nic.in/sitemap.html",
        annualReport2023_24: "https://hphighcourt.nic.in/pdf/AnnualReport23092024.pdf",
      },
    });

    expect(getHighCourtProfile("RJHC")).toMatchObject({
      courtCode: "RJHC",
      courtSlug: "rajasthan",
      courtName: "High Court of Rajasthan",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://hcraj.nic.in/",
      },
    });

    expect(getHighCourtProfile("UPHC")).toMatchObject({
      courtCode: "UPHC",
      courtSlug: "uttar-pradesh",
      courtName: "Allahabad High Court",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://www.allahabadhighcourt.in/",
      },
    });

    expect(getHighCourtProfile("GJHC")).toMatchObject({
      courtCode: "GJHC",
      courtSlug: "gujarat",
      courtName: "High Court of Gujarat",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://gujarathighcourt.nic.in/",
      },
    });

    expect(getHighCourtProfile("MPHC")).toMatchObject({
      courtCode: "MPHC",
      courtSlug: "madhya-pradesh",
      courtName: "High Court of Madhya Pradesh",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://mphc.gov.in/",
      },
    });

    expect(getHighCourtProfile("APHC")).toMatchObject({
      courtCode: "APHC",
      courtSlug: "andhra-pradesh",
      courtName: "High Court of Andhra Pradesh",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://aphc.gov.in/",
      },
    });

    expect(getHighCourtProfile("BOHC")).toEqual({
      courtCode: "BOHC",
      courtSlug: "bombay",
      courtName: "Bombay High Court",
      hcNjdgStateValue: "27~1",
      coveredGeographies: [
        {
          geographyCode: "MH",
          geographyName: "Maharashtra",
          geographyType: "state",
          lowerCourtStateCode: "MH",
        },
        {
          geographyCode: "GA",
          geographyName: "Goa",
          geographyType: "state",
          lowerCourtStateCode: "GA",
        },
        {
          geographyCode: "DNHDD",
          geographyName: "Dadra and Nagar Haveli and Daman and Diu",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://bombayhighcourt.nic.in/",
      },
    });

    expect(getHighCourtProfile("CLHC")).toEqual({
      courtCode: "CLHC",
      courtSlug: "calcutta",
      courtName: "Calcutta High Court",
      hcNjdgStateValue: "19~16",
      coveredGeographies: [
        {
          geographyCode: "WB",
          geographyName: "West Bengal",
          geographyType: "state",
          lowerCourtStateCode: "WB",
        },
        {
          geographyCode: "AN",
          geographyName: "Andaman and Nicobar Islands",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://calcuttahighcourt.gov.in/",
      },
    });

    expect(getHighCourtProfile("TSHC")).toMatchObject({
      courtCode: "TSHC",
      courtSlug: "telangana",
      courtName: "High Court for State of Telangana",
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        officialSite: "https://tshc.gov.in/",
      },
    });

    expect(getHighCourtProfile("GHHC")).toEqual({
      courtCode: "GHHC",
      courtSlug: "gauhati",
      courtName: "Gauhati High Court",
      hcNjdgStateValue: "18~6",
      coveredGeographies: [
        {
          geographyCode: "AS",
          geographyName: "Assam",
          geographyType: "state",
          lowerCourtStateCode: "AS",
        },
        {
          geographyCode: "NL",
          geographyName: "Nagaland",
          geographyType: "state",
          lowerCourtStateCode: "NL",
        },
        {
          geographyCode: "MZ",
          geographyName: "Mizoram",
          geographyType: "state",
          lowerCourtStateCode: "MZ",
        },
        {
          geographyCode: "AR",
          geographyName: "Arunachal Pradesh",
          geographyType: "state",
          lowerCourtStateCode: "AR",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://ghconline.gov.in/",
      },
    });

    expect(getHighCourtProfile("JKLHC")).toEqual({
      courtCode: "JKLHC",
      courtSlug: "jammu-kashmir-and-ladakh",
      courtName: "High Court of Jammu & Kashmir and Ladakh",
      hcNjdgStateValue: "1~12",
      coveredGeographies: [
        {
          geographyCode: "JK",
          geographyName: "Jammu and Kashmir",
          geographyType: "union_territory",
        },
        {
          geographyCode: "LA",
          geographyName: "Ladakh",
          geographyType: "union_territory",
        },
      ],
      publicBeta: false,
      sourceReviewStatus: "queued",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://jkhighcourt.nic.in/",
      },
    });

    expect(getHighCourtProfile("PHHC")).toEqual({
      courtCode: "PHHC",
      courtSlug: "punjab-and-haryana",
      courtName: "High Court of Punjab and Haryana",
      hcNjdgStateValue: "3~22",
      coveredGeographies: [
        {
          geographyCode: "PB",
          geographyName: "Punjab",
          geographyType: "state",
          lowerCourtStateCode: "PB",
        },
        {
          geographyCode: "HR",
          geographyName: "Haryana",
          geographyType: "state",
          lowerCourtStateCode: "HR",
        },
        {
          geographyCode: "CHD",
          geographyName: "Chandigarh",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://www.highcourtchd.gov.in/",
      },
    });

    expect(getHighCourtProfile("DLHC")).toEqual({
      courtCode: "DLHC",
      courtSlug: "delhi",
      courtName: "High Court of Delhi",
      hcNjdgStateValue: "7~26",
      coveredGeographies: [
        {
          geographyCode: "DL",
          geographyName: "Delhi",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://www.delhihighcourt.nic.in/",
      },
    });

    expect(getHighCourtProfile("KLHC")).toEqual({
      courtCode: "KLHC",
      courtSlug: "kerala",
      courtName: "High Court of Kerala",
      hcNjdgStateValue: "32~4",
      coveredGeographies: [
        {
          geographyCode: "KL",
          geographyName: "Kerala",
          geographyType: "state",
          lowerCourtStateCode: "KL",
        },
        {
          geographyCode: "LD",
          geographyName: "Lakshadweep",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://highcourt.kerala.gov.in/",
      },
    });

    expect(getHighCourtProfile("MDHC")).toEqual({
      courtCode: "MDHC",
      courtSlug: "madras",
      courtName: "Madras High Court",
      hcNjdgStateValue: "33~10",
      coveredGeographies: [
        {
          geographyCode: "TN",
          geographyName: "Tamil Nadu",
          geographyType: "state",
          lowerCourtStateCode: "TN",
        },
        {
          geographyCode: "PY",
          geographyName: "Puducherry",
          geographyType: "union_territory",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
        officialSite: "https://hcmadras.tn.gov.in/",
      },
    });
  });

  it("resolves high court profiles by slug", () => {
    expect(getHighCourtProfileBySlug("himachal")?.courtCode).toBe("HPHC");
    expect(getHighCourtProfileBySlug("HIMACHAL")?.courtCode).toBe("HPHC");
    expect(getHighCourtProfileBySlug("delhi")?.courtCode).toBe("DLHC");
    expect(getHighCourtProfileBySlug("jammu-kashmir-and-ladakh")?.courtCode).toBe("JKLHC");
    expect(getHighCourtProfileBySlug("kerala")?.courtCode).toBe("KLHC");
    expect(getHighCourtProfileBySlug("madras")?.courtCode).toBe("MDHC");
    expect(getHighCourtProfileBySlug("uttar-pradesh")?.courtCode).toBe("UPHC");
    expect(getHighCourtProfileBySlug("gujarat")?.courtCode).toBe("GJHC");
    expect(getHighCourtProfileBySlug("madhya-pradesh")?.courtCode).toBe("MPHC");
    expect(getHighCourtProfileBySlug("andhra-pradesh")?.courtCode).toBe("APHC");
    expect(getHighCourtProfileBySlug("bihar")?.courtCode).toBe("BRHC");
    expect(getHighCourtProfileBySlug("bombay")?.courtCode).toBe("BOHC");
    expect(getHighCourtProfileBySlug("calcutta")?.courtCode).toBe("CLHC");
    expect(getHighCourtProfileBySlug("gauhati")?.courtCode).toBe("GHHC");
    expect(getHighCourtProfileBySlug("punjab-and-haryana")?.courtCode).toBe("PHHC");
    expect(getHighCourtProfileBySlug("telangana")?.courtCode).toBe("TSHC");
    expect(getHighCourtProfileBySlug("unknown")).toBeNull();
    expect(listHighCourtProfiles()).toHaveLength(25);
    expect(listPublicHighCourtProfiles().map((profile) => profile.courtSlug)).toEqual([
      "himachal",
      "andhra-pradesh",
      "bombay",
      "calcutta",
      "telangana",
      "delhi",
      "gujarat",
      "gauhati",
      "kerala",
      "madras",
      "madhya-pradesh",
      "punjab-and-haryana",
      "rajasthan",
      "uttar-pradesh",
    ]);
    expect(listHighCourtProfiles().filter((profile) => profile.sourceReviewStatus === "reviewed")).toHaveLength(14);
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("DLHC"))).toBeNull();
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("JKLHC"))).toBeNull();
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("BOHC"))).toBe("MH");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("CLHC"))).toBe("WB");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("GHHC"))).toBe("AS");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("KLHC"))).toBe("KL");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("MDHC"))).toBe("TN");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("UPHC"))).toBe("UP");
    expect(getPrimaryHighCourtStateCode(getHighCourtProfile("PHHC"))).toBe("PB");
  });
});

describe("high court routes", () => {
  it("builds the public route namespace for each reviewed High Court beta page", () => {
    const himachalRoutes = buildPublicHighCourtRoutes(getHighCourtProfile("HPHC"));
    const uttarPradeshRoutes = buildPublicHighCourtRoutes(getHighCourtProfile("UPHC"));

    expect(himachalRoutes).toEqual({
      index: "/high-courts",
      home: "/high-courts/himachal",
      methodology: "/high-courts/himachal/methodology",
      api: "/high-courts/himachal/api",
      data: "/high-courts/himachal/data",
      statsApi: "/v1/high-courts/himachal/stats",
      trendsApi: "/v1/high-courts/himachal/trends",
    });

    expect(uttarPradeshRoutes).toEqual({
      index: "/high-courts",
      home: "/high-courts/uttar-pradesh",
      methodology: "/high-courts/uttar-pradesh/methodology",
      api: "/high-courts/uttar-pradesh/api",
      data: "/high-courts/uttar-pradesh/data",
      statsApi: "/v1/high-courts/uttar-pradesh/stats",
      trendsApi: "/v1/high-courts/uttar-pradesh/trends",
    });
  });

  it("formats court-first coverage labels and sentences", () => {
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("HPHC"))).toBe("Himachal Pradesh");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("DLHC"))).toBe("Delhi");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("JKLHC"))).toBe("Jammu and Kashmir and Ladakh");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("BOHC"))).toBe(
      "Maharashtra, Goa, and Dadra and Nagar Haveli and Daman and Diu",
    );
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("CLHC"))).toBe("West Bengal and Andaman and Nicobar Islands");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("GHHC"))).toBe(
      "Assam, Nagaland, Mizoram, and Arunachal Pradesh",
    );
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("KLHC"))).toBe("Kerala and Lakshadweep");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("MDHC"))).toBe("Tamil Nadu and Puducherry");
    expect(formatHighCourtCoverageLabel(getHighCourtProfile("PHHC"))).toBe("Punjab, Haryana, and Chandigarh");
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("GJHC"))).toBe("This page tracks High Court of Gujarat across Gujarat.");
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("DLHC"))).toBe("This page tracks High Court of Delhi across Delhi.");
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("JKLHC"))).toBe(
      "This page tracks High Court of Jammu & Kashmir and Ladakh across Jammu and Kashmir and Ladakh.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("BOHC"))).toBe(
      "This page tracks Bombay High Court across Maharashtra, Goa, and Dadra and Nagar Haveli and Daman and Diu.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("CLHC"))).toBe(
      "This page tracks Calcutta High Court across West Bengal and Andaman and Nicobar Islands.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("GHHC"))).toBe(
      "This page tracks Gauhati High Court across Assam, Nagaland, Mizoram, and Arunachal Pradesh.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("KLHC"))).toBe(
      "This page tracks High Court of Kerala across Kerala and Lakshadweep.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("MDHC"))).toBe(
      "This page tracks Madras High Court across Tamil Nadu and Puducherry.",
    );
    expect(buildHighCourtCoverageSentence(getHighCourtProfile("PHHC"))).toBe(
      "This page tracks High Court of Punjab and Haryana across Punjab, Haryana, and Chandigarh.",
    );
  });
});

describe("high court snapshot schemas", () => {
  const candidatePayload = {
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
      sourceName: "HC NJDG Himachal High Court dashboard",
      sourceSnapshotAt: null,
      referenceDateAt: "2026-04-18T09:00:00.000Z",
      referenceDateKind: "captured_at",
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
        referenceDateAt: "2026-04-18T09:00:00.000Z",
        referenceDateKind: "captured_at",
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

  it("parses legacy single-state High Court metadata into coveredGeographies", () => {
    const legacyCandidatePayload = {
      ...candidatePayload,
      snapshot: {
        ...candidatePayload.snapshot,
        stateCode: "HP",
        stateName: "Himachal Pradesh",
      },
    };
    delete (legacyCandidatePayload.snapshot as { coveredGeographies?: unknown }).coveredGeographies;

    const parsedCandidate = HighCourtSnapshotCandidateSchema.parse(legacyCandidatePayload);
    expect(parsedCandidate.snapshot.coveredGeographies).toEqual(candidatePayload.snapshot.coveredGeographies);

    const parsedCapture = HighCourtCaptureBundleSchema.parse({
      capturedAt: "2026-04-18T09:00:00.000Z",
      courtCode: "HPHC",
      courtName: "High Court of Himachal Pradesh",
      stateCode: "HP",
      stateName: "Himachal Pradesh",
      sourceName: "HC NJDG Himachal High Court dashboard",
      sourceAttribution: "High Courts of India National Judicial Data Grid for High Court of Himachal Pradesh",
      homePage: {
        url: "https://njdg.ecourts.gov.in/hcnjdg_v2/?p=home&state_code=2~5",
        html: "<html></html>",
      },
      benchOptions: [{ benchCode: "1", benchName: "Principal Bench Himachal P" }],
    });

    expect(parsedCapture.courtSlug).toBe("himachal");
    expect(parsedCapture.coveredGeographies).toEqual(candidatePayload.snapshot.coveredGeographies);
  });
});
