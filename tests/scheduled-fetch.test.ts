import { afterEach, describe, expect, it, vi } from "vitest";

const listStateProfiles = vi.fn();
const runOperatorInvocation = vi.fn();

vi.mock("../src/geographies.js", () => ({
  listStateProfiles,
}));

vi.mock("../src/dev/operator-ops.js", () => ({
  runOperatorInvocation,
}));

describe("scheduled fetch", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs the fetch flow for every implemented state in order", async () => {
    listStateProfiles.mockReturnValueOnce([
      { stateCode: "HP", stateName: "Himachal Pradesh" },
      { stateCode: "PB", stateName: "Punjab" },
      { stateCode: "UP", stateName: "Uttar Pradesh" },
    ]);
    runOperatorInvocation
      .mockResolvedValueOnce({ run: { id: "run_hp_123" } })
      .mockResolvedValueOnce({ run: { id: "run_pb_456" } })
      .mockResolvedValueOnce({ run: { id: "run_up_789" } });

    const { runScheduledFetches } = await import("../src/dev/scheduled-fetch.js");
    const summary = await runScheduledFetches("Scheduled daily internal raw fetch");

    expect(runOperatorInvocation.mock.calls).toEqual([
      [
        {
          command: "fetch",
          stateCode: "HP",
          note: "Scheduled daily internal raw fetch for Himachal Pradesh [HP]",
        },
        process.env,
      ],
      [
        {
          command: "fetch",
          stateCode: "PB",
          note: "Scheduled daily internal raw fetch for Punjab [PB]",
        },
        process.env,
      ],
      [
        {
          command: "fetch",
          stateCode: "UP",
          note: "Scheduled daily internal raw fetch for Uttar Pradesh [UP]",
        },
        process.env,
      ],
    ]);

    expect(summary).toEqual({
      notePrefix: "Scheduled daily internal raw fetch",
      totalStates: 3,
      successfulStateCodes: ["HP", "PB", "UP"],
      failedStateCodes: [],
      results: [
        {
          stateCode: "HP",
          stateName: "Himachal Pradesh",
          ok: true,
          runId: "run_hp_123",
        },
        {
          stateCode: "PB",
          stateName: "Punjab",
          ok: true,
          runId: "run_pb_456",
        },
        {
          stateCode: "UP",
          stateName: "Uttar Pradesh",
          ok: true,
          runId: "run_up_789",
        },
      ],
    });
  });

  it("records failures but keeps attempting later states", async () => {
    listStateProfiles.mockReturnValueOnce([
      { stateCode: "HP", stateName: "Himachal Pradesh" },
      { stateCode: "PB", stateName: "Punjab" },
      { stateCode: "UP", stateName: "Uttar Pradesh" },
    ]);
    runOperatorInvocation
      .mockResolvedValueOnce({ run: { id: "run_hp_123" } })
      .mockRejectedValueOnce(new Error("Punjab upstream timeout"))
      .mockResolvedValueOnce({ run: { id: "run_up_789" } });

    const { assertScheduledFetchSucceeded, runScheduledFetches } = await import("../src/dev/scheduled-fetch.js");
    const summary = await runScheduledFetches();

    expect(summary.notePrefix).toBe("Scheduled daily internal raw fetch");
    expect(summary.successfulStateCodes).toEqual(["HP", "UP"]);
    expect(summary.failedStateCodes).toEqual(["PB"]);
    expect(summary.results).toEqual([
      {
        stateCode: "HP",
        stateName: "Himachal Pradesh",
        ok: true,
        runId: "run_hp_123",
      },
      {
        stateCode: "PB",
        stateName: "Punjab",
        ok: false,
        error: "Punjab upstream timeout",
      },
      {
        stateCode: "UP",
        stateName: "Uttar Pradesh",
        ok: true,
        runId: "run_up_789",
      },
    ]);

    expect(() => assertScheduledFetchSucceeded(summary)).toThrow("Scheduled internal fetch failed for 1 state(s): PB");
  });
});
