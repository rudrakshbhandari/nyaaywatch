import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listRuns: vi.fn(),
  runOperator: vi.fn(),
  publishAlert: vi.fn(),
  endPool: vi.fn(),
}));

vi.mock("pg", () => ({ Pool: class { end = mocks.endPool; } }));
vi.mock("../src/config/env.js", () => ({ loadConfig: () => ({ DATABASE_URL: "postgres://unused" }) }));
vi.mock("../src/geographies.js", () => ({ SUPPORTED_STATE_CODES: ["CG", "HP"] }));
vi.mock("../src/dev/scheduled-fetch-targets.js", () => ({
  listReviewedHighCourtProfilesForScheduledFetch: () => [],
  getReviewedSupremeCourtProfileForScheduledFetch: () => { throw new Error("not reviewed"); },
}));
vi.mock("../src/storage/postgres.js", () => ({
  PgWarehouseStore: { fromPool: () => ({ listRuns: mocks.listRuns }) },
}));
vi.mock("../src/dev/operator-ops.js", () => ({ runOperatorInvocation: mocks.runOperator }));
vi.mock("../src/ops/alarm-notifier.js", () => ({
  createAlarmNotifier: () => ({ publish: mocks.publishAlert }),
}));

import { assertPublishPendingSweepSucceeded, runPublishPendingSweep } from "../src/ops/publish-pending-runner.js";

function run(id: string, hour: number) {
  return {
    id,
    status: "completed",
    qualityState: "complete",
    createdAt: `2026-09-07T${String(hour).padStart(2, "0")}:00:00.000Z`,
  };
}

function candidate(id: string, currentPending: number, previousPending = 413079) {
  return {
    run: { id },
    candidate: {
      snapshot: { qualityState: "complete" },
      stats: { pendingCases: currentPending },
      trends: [{ pendingCases: previousPending }, { pendingCases: currentPending }],
    },
  };
}

describe("publish-pending sweep review digests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));
    mocks.listRuns.mockResolvedValue([]);
    mocks.publishAlert.mockResolvedValue(undefined);
    mocks.endPool.mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("evaluates every held run and sends one digest with each run's evidence", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("newest", 10), run("middle", 9), run("oldest", 8)]);
    const pending: Record<string, number> = { oldest: 516194, middle: 520038, newest: 521000 };
    mocks.runOperator.mockImplementation(async ({ targetId }) => candidate(targetId, pending[targetId]));

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ candidatesFound: 3, publishedCount: 0, skippedCount: 3, failedCount: 0 });
    expect(mocks.runOperator.mock.calls.map(([request]) => [request.command, request.targetId]))
      .toEqual([["inspect", "oldest"], ["inspect", "middle"], ["inspect", "newest"]]);
    expect(mocks.publishAlert).toHaveBeenCalledTimes(1);
    const [subject, message] = mocks.publishAlert.mock.calls[0];
    expect(subject).toBe("NyaayWatch review required: State (CG)");
    expect(message).toContain("Held runs requiring review: 3");
    for (const [id, value] of Object.entries(pending)) {
      expect(message).toContain(`Run: ${id}\nReason: outlier_pending_delta\nQuality state: complete\nCurrent pending: ${value}\nHistorical baseline pending: 413079`);
    }
    expect(message).toContain("Delta fraction: 25.0% (threshold 20%)");
    expect(message).toContain("Delta fraction: 25.9% (threshold 20%)");
    expect(mocks.endPool).toHaveBeenCalledOnce();
  });

  it("keeps different scopes in separate digests", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("cg", 8)]).mockResolvedValueOnce([run("hp", 8)]);
    mocks.runOperator.mockImplementation(async ({ targetId }) => candidate(targetId, 520038));

    await runPublishPendingSweep({});

    expect(mocks.publishAlert.mock.calls.map(([subject]) => subject)).toEqual([
      "NyaayWatch review required: State (CG)", "NyaayWatch review required: State (HP)",
    ]);
    expect(mocks.publishAlert.mock.calls[0][1]).not.toContain("Run: hp");
    expect(mocks.publishAlert.mock.calls[1][1]).not.toContain("Run: cg");
  });

  it("omits superseded holds and uses the successful publication baseline for later holds", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("latest-hold", 10), run("safe", 9), run("superseded", 8)]);
    const pending: Record<string, number> = { superseded: 520038, safe: 450000, "latest-hold": 560000 };
    mocks.runOperator.mockImplementation(async ({ targetId }) => candidate(targetId, pending[targetId]));

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ candidatesFound: 3, publishedCount: 1, skippedCount: 2, failedCount: 0 });
    expect(mocks.runOperator).toHaveBeenCalledWith(expect.objectContaining({ command: "publish", targetId: "safe" }), {});
    expect(mocks.publishAlert).toHaveBeenCalledTimes(1);
    const message = mocks.publishAlert.mock.calls[0][1];
    expect(message).toContain("Held runs requiring review: 1");
    expect(message).toContain("Run: latest-hold");
    expect(message).toContain("Historical baseline pending: 450000");
    expect(message).not.toContain("Run: superseded");
  });

  it("sends no review digest after a later publication supersedes all held runs", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("safe", 9), run("superseded", 8)]);
    mocks.runOperator.mockImplementation(async ({ targetId }) => candidate(targetId, targetId === "safe" ? 450000 : 520038));

    const summary = await runPublishPendingSweep({});

    expect(summary.publishedCount).toBe(1);
    expect(mocks.publishAlert).not.toHaveBeenCalled();
  });

  it("alerts publish failures immediately without clearing earlier review holds", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("publish-fails", 9), run("held", 8)]);
    mocks.runOperator.mockImplementation(async ({ command, targetId }) => {
      if (command === "publish") throw new Error("database unavailable");
      return candidate(targetId, targetId === "held" ? 520038 : 450000);
    });

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ publishedCount: 0, skippedCount: 1, failedCount: 1 });
    expect(mocks.publishAlert.mock.calls.map(([subject]) => subject)).toEqual([
      "NyaayWatch auto-publish failed: State (CG)", "NyaayWatch review required: State (CG)",
    ]);
    expect(mocks.publishAlert.mock.calls[0][1]).toContain("Run: publish-fails");
    expect(mocks.publishAlert.mock.calls[1][1]).toContain("Run: held");
  });

  it("clears earlier holds when publish committed before cache invalidation failed", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("committed", 9), run("held", 8)]);
    mocks.runOperator.mockImplementation(async ({ command, targetId }) => {
      if (command === "publish") throw new Error("Cloudflare purge failed");
      if (command === "publications") return [{ run: { id: "committed" } }];
      return candidate(targetId, targetId === "committed" ? 450000 : 520038);
    });

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ candidatesFound: 2, publishedCount: 1, skippedCount: 1, failedCount: 0 });
    expect(mocks.publishAlert).toHaveBeenCalledTimes(1);
    expect(mocks.publishAlert.mock.calls[0][0]).toContain("cache invalidation warning");
    expect(mocks.publishAlert.mock.calls[0][1]).toContain("Run: committed");
    expect(mocks.publishAlert.mock.calls[0][1]).not.toContain("Run: held");
  });

  it("fails the sweep when the committed-publish warning cannot be delivered", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("committed", 9)]);
    mocks.runOperator.mockImplementation(async ({ command }) => {
      if (command === "publish") throw new Error("Cloudflare purge failed");
      if (command === "publications") return [{ run: { id: "committed" } }];
      return candidate("committed", 450000);
    });
    mocks.publishAlert.mockRejectedValue(new Error("SNS unavailable"));

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ candidatesFound: 1, publishedCount: 1, skippedCount: 0, failedCount: 1 });
    expect(summary.results[0]).toMatchObject({
      runId: "committed",
      autoPublish: "published",
      ok: false,
      error: "Cache invalidation warning delivery failed: SNS unavailable",
    });
    expect(() => assertPublishPendingSweepSucceeded(summary)).toThrow("Publish-pending sweep failed for 1 run(s)");
  });

  it("still reports collected holds when inspecting a later candidate fails", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("inspect-fails", 9), run("held", 8)]);
    mocks.runOperator.mockImplementation(async ({ targetId }) => {
      if (targetId === "inspect-fails") throw new Error("artifact unavailable");
      return candidate(targetId, 520038);
    });

    const summary = await runPublishPendingSweep({});

    expect(summary.failedCount).toBe(1);
    expect(mocks.publishAlert).toHaveBeenCalledWith(expect.any(String), expect.stringContaining("Run: held"));
  });

  it("records failed digest delivery and continues publishing later scopes", async () => {
    mocks.listRuns.mockResolvedValueOnce([run("held-new", 9), run("held-old", 8)]).mockResolvedValueOnce([run("hp-safe", 8)]);
    mocks.runOperator.mockImplementation(async ({ targetId }) => candidate(targetId, targetId === "hp-safe" ? 450000 : 520038));
    mocks.publishAlert.mockRejectedValue(new Error("SNS unavailable"));

    const summary = await runPublishPendingSweep({});

    expect(summary).toMatchObject({ candidatesFound: 3, publishedCount: 1, skippedCount: 0, failedCount: 2 });
    expect(summary.results.filter((result) => !result.ok)).toEqual([
      expect.objectContaining({ runId: "held-old", autoPublish: "skipped_review", error: "Review digest notification failed: SNS unavailable" }),
      expect.objectContaining({ runId: "held-new", autoPublish: "skipped_review", error: "Review digest notification failed: SNS unavailable" }),
    ]);
    expect(mocks.runOperator).toHaveBeenCalledWith(expect.objectContaining({ command: "publish", targetId: "hp-safe", stateCode: "HP" }), {});
    expect(() => assertPublishPendingSweepSucceeded(summary)).toThrow("Publish-pending sweep failed for 2 run(s)");
    expect(mocks.endPool).toHaveBeenCalledOnce();
  });
});
