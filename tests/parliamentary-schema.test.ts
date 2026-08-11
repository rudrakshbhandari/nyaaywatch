import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ParliamentaryCaptureBundleSchema } from "../src/domain/parliamentary-schema.js";
import { FixtureParliamentarySourceClient } from "../src/ingest/parliamentary-source-client.js";

const fixtureClient = new FixtureParliamentarySourceClient(join(process.cwd(), "fixtures/parliament"));

describe("parliamentary capture schema", () => {
  it("parses a source-safe Lok Sabha fixture with official links and no raw documents", async () => {
    const capture = await fixtureClient.capture();
    const parsed = ParliamentaryCaptureBundleSchema.parse(capture);

    expect(parsed.house).toBe("lok_sabha");
    expect(parsed.lokSabhaNumber).toBe(18);
    expect(parsed.sessionNumber).toBe(5);
    expect(parsed.sessionStartDate).toBe("2025-07-21");
    expect(parsed.sessionEndDate).toBe("2025-08-21");
    expect(parsed.person).toMatchObject({
      personId: "mp-5814",
      fullName: "Shri Mani A",
      party: { abbreviation: "DMK" },
      constituency: { name: "Dharmapuri", stateOrUnionTerritory: "Tamil Nadu" },
    });
    expect(parsed.roles).toHaveLength(2);
    expect(parsed.bills).toHaveLength(15);
    expect(parsed.bills.every((bill) => bill.officialUrl.startsWith("https://sansad.in/"))).toBe(true);
    expect(parsed.bills.every((bill) => bill.introducedByMemberId === null)).toBe(true);
    expect(parsed.questions).toHaveLength(20);
    expect(parsed.questions[0]).toMatchObject({
      questionNumber: "4647",
      subject: "Khadi Institutions in Tamil Nadu",
      ministry: "MICRO, SMALL AND MEDIUM ENTERPRISES",
      questionType: "UNSTARRED",
      askedDate: "2025-08-21",
      memberId: "mp-5814",
    });
    expect(parsed.participation.questionCount).toBe(125);
    expect(parsed.participation.questionCountScope).toBe("lok_sabha");
    expect(parsed.sourceResultTotals.questionRecords).toBe(20);
    expect(parsed.sourceEvidence.some((evidence) => evidence.evidenceId === "ds-questions-18-5-member-5814")).toBe(true);
    expect(parsed.sourceEvidence.some((evidence) => evidence.sourceSystem === "parliament_digital_library")).toBe(true);
    expect(parsed.sourceEvidence.every((evidence) => !evidence.url.includes(".pdf"))).toBe(true);
  });
});
