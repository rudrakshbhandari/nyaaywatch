import { describe, expect, it, vi } from "vitest";

vi.mock("../src/high-courts.js", () => ({
  listHighCourtProfiles: vi.fn(() => [
    {
      courtCode: "HPHC",
      courtSlug: "himachal",
      sourceReviewStatus: "reviewed",
    },
    {
      courtCode: "UPHC",
      courtSlug: "uttar-pradesh",
      sourceReviewStatus: "queued",
    },
    {
      courtCode: "RJHC",
      courtSlug: "rajasthan",
      sourceReviewStatus: "queued",
    },
  ]),
}));

vi.mock("../src/dev/high-court-readiness-verification.js", () => ({
  verifyHighCourtInternalReadiness: vi.fn(async (_baseUrl: string, _operatorToken: string, options: { courtSlug: string; now?: Date }) => ({
    baseUrl: "https://nyaaywatch.in",
    checkedAt: options.now?.toISOString() ?? "2026-04-19T00:00:00.000Z",
    target: {
      courtCode: options.courtSlug.toUpperCase(),
      courtSlug: options.courtSlug,
      courtName: options.courtSlug,
      stateCode: "XX",
      stateName: "Example",
      detailPath: `/operator/high-courts/${options.courtSlug}`,
      runsPath: `/operator/high-courts/${options.courtSlug}/runs`,
      publicationsPath: `/operator/high-courts/${options.courtSlug}/publications`,
    },
    operatorAuthProtected: true as const,
    snapshot: options.courtSlug === "rajasthan" ? null : ({} as never),
    internalEvidence: {
      runCount: options.courtSlug === "rajasthan" ? 0 : 3,
      publicationCount: options.courtSlug === "rajasthan" ? 0 : 3,
      publishCount: options.courtSlug === "rajasthan" ? 0 : 2,
      rollbackCount: options.courtSlug === "himachal" ? 1 : 0,
      replayedRunCount: options.courtSlug === "himachal" ? 1 : 0,
      latestRunId: null,
      latestRunStatus: null,
      latestPublicationId: null,
      rollbackTargetPublicationId: null,
    },
    gates: {
      hasPublishedSnapshot: options.courtSlug !== "rajasthan",
      hasReplayEvidence: options.courtSlug === "himachal",
      hasRollbackEvidence: options.courtSlug === "himachal",
      referenceDateContractDefensible: options.courtSlug !== "rajasthan",
      internalProofBarSatisfied: options.courtSlug === "himachal",
    },
  })),
}));

describe("verifyHighCourtInternalWaveReadiness", () => {
  it("filters by queued courts when requested and aggregates gate totals", async () => {
    const { verifyHighCourtInternalWaveReadiness } = await import("../src/dev/high-court-wave-readiness-verification.js");

    const summary = await verifyHighCourtInternalWaveReadiness("https://nyaaywatch.in/", "operator-token", {
      sourceReviewStatus: "queued",
      now: new Date("2026-04-19T10:00:00.000Z"),
    });

    expect(summary.baseUrl).toBe("https://nyaaywatch.in");
    expect(summary.scope.courtSlugs).toEqual(["uttar-pradesh", "rajasthan"]);
    expect(summary.totals).toEqual({
      configuredCourts: 2,
      readyCourts: 0,
      publishedCourts: 1,
      replayReadyCourts: 0,
      rollbackReadyCourts: 0,
    });
  });

  it("uses explicit court slugs when provided", async () => {
    const { verifyHighCourtInternalWaveReadiness } = await import("../src/dev/high-court-wave-readiness-verification.js");

    const summary = await verifyHighCourtInternalWaveReadiness("https://nyaaywatch.in", "operator-token", {
      courtSlugs: ["himachal", "rajasthan"],
      sourceReviewStatus: "queued",
      now: new Date("2026-04-19T10:00:00.000Z"),
    });

    expect(summary.scope.courtSlugs).toEqual(["himachal", "rajasthan"]);
    expect(summary.totals.readyCourts).toBe(1);
    expect(summary.courts.map((court) => court.target.courtSlug)).toEqual(["himachal", "rajasthan"]);
  });

  it("parses comma-separated court slugs and review-status flags", async () => {
    const { readCourtSlugs, resolveSourceReviewStatus } = await import("../src/dev/high-court-wave-readiness-verification.js");

    expect(readCourtSlugs(" himachal, uttar-pradesh ,rajasthan ")).toEqual(["himachal", "uttar-pradesh", "rajasthan"]);
    expect(resolveSourceReviewStatus("queued")).toBe("queued");
    expect(resolveSourceReviewStatus(undefined)).toBe("all");
    expect(() => resolveSourceReviewStatus("invalid")).toThrow("Unsupported source review status: invalid");
  });
});
