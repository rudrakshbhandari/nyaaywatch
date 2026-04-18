import { afterEach, describe, expect, it, vi } from "vitest";

const listPublicStateProfiles = vi.fn();
const verifyPublicRelease = vi.fn();

vi.mock("../src/geographies.js", () => ({
  listPublicStateProfiles,
}));

vi.mock("../src/dev/release-verification.js", () => ({
  verifyPublicRelease,
}));

describe("public alpha ops verification", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates the public-state sweep and keeps healthy states green", async () => {
    listPublicStateProfiles.mockReturnValueOnce([
      { stateCode: "HP", stateName: "Himachal Pradesh", stateSlug: "himachal-pradesh" },
      { stateCode: "PB", stateName: "Punjab", stateSlug: "punjab" },
    ]);
    verifyPublicRelease
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          stateCode: "HP",
          stateName: "Himachal Pradesh",
          stateSlug: "himachal-pradesh",
          statsPath: "/v1/stats/himachal",
          districtsPath: "/v1/districts",
          trendsPath: "/v1/trends",
          dataPagePath: "/data",
          districtsCsvPath: "/data/districts.csv",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          publishedAt: "2026-04-18T08:00:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 0,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_hp",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: 12,
        trendCount: 2,
        csvMetadataParity: true,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      })
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          stateCode: "PB",
          stateName: "Punjab",
          stateSlug: "punjab",
          statsPath: "/v1/states/punjab/stats",
          districtsPath: "/v1/states/punjab/districts",
          trendsPath: "/v1/states/punjab/trends",
          dataPagePath: "/states/punjab/data",
          districtsCsvPath: "/states/punjab/data/districts.csv",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-17T00:00:00.000Z",
          publishedAt: "2026-04-18T08:05:00.000Z",
          freshnessDaysAtPublish: 1,
          currentFreshnessDays: 1,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_pb",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: 22,
        trendCount: 1,
        csvMetadataParity: true,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      });

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(summary.totalStates).toBe(2);
    expect(summary.healthyStates).toEqual(["HP", "PB"]);
    expect(summary.staleStates).toEqual([]);
    expect(summary.dailyFetchLagStates).toEqual([]);
    expect(summary.failingStates).toEqual([]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).not.toThrow();
  });

  it("fails when a state verification breaks or the daily fetch cadence is behind", async () => {
    listPublicStateProfiles.mockReturnValueOnce([
      { stateCode: "HP", stateName: "Himachal Pradesh", stateSlug: "himachal-pradesh" },
      { stateCode: "PB", stateName: "Punjab", stateSlug: "punjab" },
      { stateCode: "HR", stateName: "Haryana", stateSlug: "haryana" },
    ]);
    verifyPublicRelease
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          stateCode: "HP",
          stateName: "Himachal Pradesh",
          stateSlug: "himachal-pradesh",
          statsPath: "/v1/stats/himachal",
          districtsPath: "/v1/districts",
          trendsPath: "/v1/trends",
          dataPagePath: "/data",
          districtsCsvPath: "/data/districts.csv",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          publishedAt: "2026-04-18T08:00:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 0,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_hp",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: 12,
        trendCount: 2,
        csvMetadataParity: true,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      })
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          stateCode: "PB",
          stateName: "Punjab",
          stateSlug: "punjab",
          statsPath: "/v1/states/punjab/stats",
          districtsPath: "/v1/states/punjab/districts",
          trendsPath: "/v1/states/punjab/trends",
          dataPagePath: "/states/punjab/data",
          districtsCsvPath: "/states/punjab/data/districts.csv",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-15T00:00:00.000Z",
          publishedAt: "2026-04-15T08:00:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 3,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_pb",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: 22,
        trendCount: 1,
        csvMetadataParity: true,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      })
      .mockRejectedValueOnce(new Error("Expected https://nyaaywatch.in/v1/states/haryana/stats to return 200, received 500"));

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(summary.healthyStates).toEqual(["HP"]);
    expect(summary.dailyFetchLagStates).toEqual(["PB"]);
    expect(summary.failingStates).toEqual(["HR"]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).toThrow(
      "Public alpha operations check failed: verification failures: HR; daily internal fetch lag: PB",
    );
  });
});
