import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listPublicStateProfiles = vi.fn();
const listPublicHighCourtProfiles = vi.fn();
const getSupremeCourtProfile = vi.fn();
const verifyPublicRelease = vi.fn();
const fetchMock = vi.fn();

vi.mock("../src/geographies.js", () => ({
  listPublicStateProfiles,
}));

vi.mock("../src/high-courts.js", () => ({
  listPublicHighCourtProfiles,
}));

vi.mock("../src/supreme-court.js", () => ({
  getSupremeCourtProfile,
}));

vi.mock("../src/dev/release-verification.js", () => ({
  verifyPublicRelease,
}));

describe("public alpha ops verification", () => {
  global.fetch = fetchMock as typeof fetch;

  beforeEach(() => {
    listPublicHighCourtProfiles.mockReturnValue([]);
    getSupremeCourtProfile.mockReturnValue({
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
      publicBeta: false,
    });
  });

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
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_hp_latest",
                stateCode: "HP",
                sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-18T08:10:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_pb_latest",
                stateCode: "PB",
                sourceSnapshotAt: "2026-04-14T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-18T08:12:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.totalStates).toBe(2);
    expect(summary.totalTargets).toBe(2);
    expect(summary.healthyStates).toEqual(["HP", "PB"]);
    expect(summary.healthyTargets).toEqual(["HP", "PB"]);
    expect(summary.staleStates).toEqual([]);
    expect(summary.dailyFetchLagStates).toEqual([]);
    expect(summary.failingStates).toEqual([]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).not.toThrow();
  });

  it("retries transient operator run-history fetch failures before marking a target unhealthy", async () => {
    listPublicStateProfiles.mockReturnValueOnce([{ stateCode: "HP", stateName: "Himachal Pradesh", stateSlug: "himachal-pradesh" }]);
    verifyPublicRelease.mockResolvedValueOnce({
      baseUrl: "https://nyaaywatch.in",
      checkedAt: "2026-06-01T05:30:00.000Z",
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
        sourceSnapshotAt: "2026-06-01T00:00:00.000Z",
        publishedAt: "2026-06-01T03:00:00.000Z",
        freshnessDaysAtPublish: 0,
        currentFreshnessDays: 0,
        methodologyVersion: "2026.04-alpha",
        qualityState: "complete",
        publishedFromRunId: "run_hp",
        replayedFromRunId: null,
      },
      health: { region: "ap-south-1", stateCode: "HP" },
      districtCount: 12,
      trendCount: 5,
      csvMetadataParity: true,
      publicDataCacheProtected: true,
      operatorAuthProtected: true,
    });
    fetchMock
      .mockRejectedValueOnce(new Error("The operation was aborted due to timeout"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_hp_latest",
                stateCode: "HP",
                sourceSnapshotAt: "2026-06-01T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-06-01T03:01:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-06-01T05:30:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(summary.healthyStates).toEqual(["HP"]);
    expect(summary.failingStates).toEqual([]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).not.toThrow();
  });

  it("covers public High Court and Supreme Court release targets in the ops sweep", async () => {
    listPublicStateProfiles.mockReturnValueOnce([]);
    listPublicHighCourtProfiles.mockReturnValueOnce([
      {
        courtCode: "HPHC",
        courtName: "High Court of Himachal Pradesh",
        courtSlug: "himachal",
      },
    ]);
    getSupremeCourtProfile.mockReturnValueOnce({
      courtCode: "SCI",
      courtName: "Supreme Court of India",
      courtSlug: "supreme-court",
      publicBeta: true,
    });
    verifyPublicRelease
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          tier: "high_court",
          identifier: "HPHC",
          label: "High Court of Himachal Pradesh",
          courtCode: "HPHC",
          courtName: "High Court of Himachal Pradesh",
          courtSlug: "himachal",
          statsPath: "/v1/high-courts/himachal/stats",
          trendsPath: "/v1/high-courts/himachal/trends",
          dataPagePath: "/high-courts/himachal/data",
          operatorAuthPath: "/operator/high-courts/himachal/publications",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          referenceDateAt: "2026-04-18T00:00:00.000Z",
          referenceDateKind: "source_snapshot_at",
          publishedAt: "2026-04-18T08:00:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 0,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_hphc",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: null,
        trendCount: 1,
        csvMetadataParity: null,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      })
      .mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-18T12:00:00.000Z",
        target: {
          tier: "supreme_court",
          identifier: "SCI",
          label: "Supreme Court of India",
          courtCode: "SCI",
          courtName: "Supreme Court of India",
          courtSlug: "supreme-court",
          statsPath: "/v1/supreme-court/stats",
          trendsPath: "/v1/supreme-court/trends",
          dataPagePath: "/supreme-court/data",
          operatorAuthPath: "/operator/supreme-court/publications",
        },
        snapshot: {
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          referenceDateAt: "2026-04-18T00:00:00.000Z",
          referenceDateKind: "source_snapshot_at",
          publishedAt: "2026-04-18T08:05:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 0,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: "run_sci",
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: null,
        trendCount: 1,
        csvMetadataParity: null,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      });
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_hphc",
                stateCode: "HPHC",
                sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-18T08:10:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_sci",
                stateCode: "SCI",
                sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-18T08:12:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.totalStates).toBe(0);
    expect(summary.totalTargets).toBe(2);
    expect(summary.healthyTargets).toEqual(["high_court:HPHC", "supreme_court:SCI"]);
    expect(summary.targets.map((target) => target.tier)).toEqual(["high_court", "supreme_court"]);
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(1, "https://nyaaywatch.in", {
      highCourtSlug: "himachal",
      now: new Date("2026-04-18T12:00:00.000Z"),
    });
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(2, "https://nyaaywatch.in", {
      supremeCourt: true,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      "https://nyaaywatch.in/operator/high-courts/himachal/runs",
      "https://nyaaywatch.in/operator/supreme-court/runs",
    ]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).not.toThrow();
  });

  it("limits smoke sweeps to representative lower-court, High Court, and Supreme Court targets", async () => {
    listPublicStateProfiles.mockReturnValueOnce([
      { stateCode: "HP", stateName: "Himachal Pradesh", stateSlug: "himachal-pradesh" },
      { stateCode: "PB", stateName: "Punjab", stateSlug: "punjab" },
      { stateCode: "HR", stateName: "Haryana", stateSlug: "haryana" },
    ]);
    listPublicHighCourtProfiles.mockReturnValueOnce([
      {
        courtCode: "HPHC",
        courtName: "High Court of Himachal Pradesh",
        courtSlug: "himachal",
      },
      {
        courtCode: "DLHC",
        courtName: "Delhi High Court",
        courtSlug: "delhi",
      },
    ]);
    getSupremeCourtProfile.mockReturnValueOnce({
      courtCode: "SCI",
      courtName: "Supreme Court of India",
      courtSlug: "supreme-court",
      publicBeta: true,
    });

    for (const [runId, stateCode] of [
      ["run_hp", "HP"],
      ["run_pb", "PB"],
      ["run_hphc", "HPHC"],
      ["run_sci", "SCI"],
    ]) {
      verifyPublicRelease.mockResolvedValueOnce({
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-06-24T12:00:00.000Z",
        target: {},
        snapshot: {
          sourceSnapshotAt: "2026-06-24T00:00:00.000Z",
          referenceDateAt: "2026-06-24T00:00:00.000Z",
          referenceDateKind: "captured_at",
          publishedAt: "2026-06-24T03:00:00.000Z",
          freshnessDaysAtPublish: 0,
          currentFreshnessDays: 0,
          methodologyVersion: "2026.04-alpha",
          qualityState: "complete",
          publishedFromRunId: runId,
          replayedFromRunId: null,
        },
        health: { region: "ap-south-1", stateCode: "HP" },
        districtCount: stateCode.endsWith("HC") || stateCode === "SCI" ? null : 1,
        trendCount: 1,
        csvMetadataParity: stateCode.endsWith("HC") || stateCode === "SCI" ? null : true,
        publicDataCacheProtected: true,
        operatorAuthProtected: true,
      });
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: runId,
                stateCode,
                sourceSnapshotAt: "2026-06-24T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-06-24T03:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    }

    const { verifyPublicAlphaOperations } = await import("../src/dev/public-alpha-ops.js");
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-06-24T12:00:00.000Z"),
      operatorToken: "operator-test-token",
      targetSet: "smoke",
    });

    expect(summary.totalTargets).toBe(4);
    expect(summary.healthyTargets).toEqual(["HP", "PB", "high_court:HPHC", "supreme_court:SCI"]);
    expect(verifyPublicRelease).toHaveBeenCalledTimes(4);
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(1, "https://nyaaywatch.in", {
      stateSlug: "himachal-pradesh",
      now: new Date("2026-06-24T12:00:00.000Z"),
    });
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(2, "https://nyaaywatch.in", {
      stateSlug: "punjab",
      now: new Date("2026-06-24T12:00:00.000Z"),
    });
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(3, "https://nyaaywatch.in", {
      highCourtSlug: "himachal",
      now: new Date("2026-06-24T12:00:00.000Z"),
    });
    expect(verifyPublicRelease).toHaveBeenNthCalledWith(4, "https://nyaaywatch.in", {
      supremeCourt: true,
      now: new Date("2026-06-24T12:00:00.000Z"),
    });
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
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_hp_latest",
                stateCode: "HP",
                sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-18T08:10:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            runs: [
              {
                id: "run_pb_latest",
                stateCode: "PB",
                sourceSnapshotAt: "2026-04-15T00:00:00.000Z",
                status: "completed",
                completedAt: "2026-04-15T08:10:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } = await import(
      "../src/dev/public-alpha-ops.js"
    );
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.healthyStates).toEqual(["HP"]);
    expect(summary.dailyFetchLagStates).toEqual(["PB"]);
    expect(summary.failingStates).toEqual(["HR"]);
    expect(() => assertPublicAlphaOperationsHealthy(summary)).toThrow(
      "Public alpha operations check failed: verification failures: HR; daily internal fetch lag: PB",
    );
  });

  it("does not treat an older run source snapshot date as fetch lag when the successful run finished recently", async () => {
    listPublicStateProfiles.mockReturnValueOnce([{ stateCode: "HP", stateName: "Himachal Pradesh", stateSlug: "himachal-pradesh" }]);
    verifyPublicRelease.mockResolvedValueOnce({
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
        sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
        publishedAt: "2026-04-15T08:00:00.000Z",
        freshnessDaysAtPublish: 5,
        currentFreshnessDays: 8,
        methodologyVersion: "2026.04-alpha",
        qualityState: "complete",
        publishedFromRunId: "run_hp_published",
        replayedFromRunId: null,
      },
      health: { region: "ap-south-1", stateCode: "HP" },
      districtCount: 12,
      trendCount: 3,
      csvMetadataParity: true,
      publicDataCacheProtected: true,
      operatorAuthProtected: true,
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          runs: [
            {
              id: "run_hp_latest",
              stateCode: "HP",
              sourceSnapshotAt: "2026-04-14T00:00:00.000Z",
              status: "completed",
              completedAt: "2026-04-17T20:10:06.000Z",
            },
            {
              id: "run_hp_published",
              stateCode: "HP",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              status: "published",
              completedAt: "2026-04-15T04:44:05.000Z",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { verifyPublicAlphaOperations } = await import("../src/dev/public-alpha-ops.js");
    const summary = await verifyPublicAlphaOperations("https://nyaaywatch.in", {
      now: new Date("2026-04-18T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.dailyFetchLagStates).toEqual([]);
    expect(summary.healthyStates).toEqual(["HP"]);
    expect(summary.states[0]).toMatchObject({
      sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
      currentFreshnessDays: 8,
      latestSuccessfulRunId: "run_hp_latest",
      latestSuccessfulRunSourceSnapshotAt: "2026-04-14T00:00:00.000Z",
      latestSuccessfulRunLagDays: 0,
      dailyFetchLagDetected: false,
    });
  });
});
