import { describe, expect, it } from "vitest";

import {
  composeNjdgOutreachMessage,
  deriveOutreachRecipients,
  parseEmailList,
  sourceReportsMissingMonthlyMovement,
  type MissingMonthlyMovementIssue,
} from "../src/dev/njdg-missing-zero-outreach.js";
import { listStateProfiles } from "../src/geographies.js";

function issue(overrides: Partial<MissingMonthlyMovementIssue> = {}): MissingMonthlyMovementIssue {
  return {
    scope: "state",
    stateCode: "AR",
    stateName: "Arunachal Pradesh",
    sourceSnapshotAt: "2026-04-30T00:00:00.000Z",
    sourceAttribution: "National Judicial Data Grid",
    pendingCases: 1200,
    filedLastMonthCases: 0,
    clearedLastMonthCases: 0,
    publicUrl: "https://nyaaywatch.in/states/arunachal-pradesh",
    ...overrides,
  };
}

describe("NJDG missing zero outreach", () => {
  it("flags only non-empty pending rows with zero monthly movement", () => {
    expect(sourceReportsMissingMonthlyMovement(1, 0, 0)).toBe(true);
    expect(sourceReportsMissingMonthlyMovement(0, 0, 0)).toBe(false);
    expect(sourceReportsMissingMonthlyMovement(1, 2, 0)).toBe(false);
    expect(sourceReportsMissingMonthlyMovement(1, 0, 3)).toBe(false);
  });

  it("routes affected rows to the official CPC contact for each state or Union Territory", () => {
    expect(
      deriveOutreachRecipients([
        issue({ stateCode: "AR", stateName: "Arunachal Pradesh" }),
        issue({ stateCode: "NL", stateName: "Nagaland" }),
        issue({ stateCode: "ML", stateName: "Meghalaya" }),
        issue({ stateCode: "WB", stateName: "West Bengal" }),
        issue({ stateCode: "AN", stateName: "Andaman and Nicobar Islands" }),
      ]),
    ).toEqual(["cpc-asm@aij.gov.in", "cpc-mgl@aij.gov.in", "cpc-cal@aij.gov.in"]);
  });

  it("has an official CPC route for every supported lower-court geography", () => {
    expect(() =>
      deriveOutreachRecipients(
        listStateProfiles().map((profile) =>
          issue({
            stateCode: profile.stateCode,
            stateName: profile.stateName,
          }),
        ),
      ),
    ).not.toThrow();
  });

  it("adds optional extra recipients without duplicating CPC addresses", () => {
    expect(deriveOutreachRecipients([issue()], "cpc-asm@aij.gov.in, ecommittee@aij.gov.in")).toEqual([
      "cpc-asm@aij.gov.in",
      "ecommittee@aij.gov.in",
    ]);
  });

  it("keeps the email wording source-aware and includes recipients", () => {
    const message = composeNjdgOutreachMessage("https://nyaaywatch.in", [issue()]);

    expect(message.to).toEqual(["cpc-asm@aij.gov.in"]);
    expect(message.text).toContain("under your High Court CPC coverage");
    expect(message.text).toContain("We are marking these derived monthly movement metrics as N/A");
    expect(message.text).toContain("NJDG shows a non-zero pending backlog but reports 0 filed and 0 disposed cases");
  });

  it("parses comma-separated recipient overrides", () => {
    expect(parseEmailList(" one@example.com, two@example.com ,, ")).toEqual(["one@example.com", "two@example.com"]);
  });
});
