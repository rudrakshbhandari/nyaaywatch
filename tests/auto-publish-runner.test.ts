import { describe, expect, it, vi } from "vitest";

import type { AlarmNotifier } from "../src/ops/alarm-notifier.js";
import { runAutoPublish } from "../src/ops/auto-publish-runner.js";

function makeNotifier(): AlarmNotifier & { calls: Array<{ subject: string; message: string }> } {
  const calls: Array<{ subject: string; message: string }> = [];
  return {
    calls,
    async publish(subject, message) {
      calls.push({ subject, message });
    },
  };
}

const baseFetchResult = (qualityState: string, currentPending: number, previousPending?: number) => ({
  run: { id: "run_abc" },
  candidate: {
    snapshot: { qualityState },
    stats: { pendingTotalCases: currentPending, pendingCases: currentPending },
    trends: previousPending !== undefined
      ? [
          { pendingTotalCases: previousPending, pendingCases: previousPending },
          { pendingTotalCases: currentPending, pendingCases: currentPending },
        ]
      : [{ pendingTotalCases: currentPending, pendingCases: currentPending }],
  },
});

describe("runAutoPublish", () => {
  it("publishes when gate allows and calls operator with the run id", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn().mockResolvedValue({ ok: true });

    const outcome = await runAutoPublish(
      {
        scopeLabel: "Supreme Court (supreme-court)",
        selector: { supremeCourt: true },
        fetchResult: baseFetchResult("complete", 10500, 10000),
        pendingField: "pendingTotalCases",
        note: "daily auto-publish",
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("published");
    expect(outcome.publishRunId).toBe("run_abc");
    expect(runOperator).toHaveBeenCalledWith(
      expect.objectContaining({ command: "publish", targetId: "run_abc", supremeCourt: true }),
      expect.anything(),
    );
    expect(notifier.calls).toHaveLength(0);
  });

  it("notifies and skips publish when delta exceeds threshold", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn();

    const outcome = await runAutoPublish(
      {
        scopeLabel: "State (HP)",
        selector: { stateCode: "HP" },
        fetchResult: baseFetchResult("complete", 20000, 10000),
        pendingField: "pendingCases",
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("skipped_review");
    expect(outcome.decision?.reason).toBe("outlier_pending_delta");
    expect(runOperator).not.toHaveBeenCalled();
    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0].subject).toContain("review required");
    expect(notifier.calls[0].message).toContain("run_abc");
    expect(notifier.calls[0].message).toContain("outlier_pending_delta");
  });

  it("notifies when quality is not complete", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn();

    const outcome = await runAutoPublish(
      {
        scopeLabel: "State (HP)",
        selector: { stateCode: "HP" },
        fetchResult: baseFetchResult("partial", 10000, 10000),
        pendingField: "pendingCases",
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("skipped_review");
    expect(outcome.decision?.reason).toBe("quality_not_complete");
    expect(runOperator).not.toHaveBeenCalled();
    expect(notifier.calls).toHaveLength(1);
  });

  it("reports missing gate inputs when the fetch result lacks a candidate", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn();

    const outcome = await runAutoPublish(
      {
        scopeLabel: "State (HP)",
        selector: { stateCode: "HP" },
        fetchResult: { run: { id: "run_abc" } },
        pendingField: "pendingCases",
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("gate_inputs_missing");
    expect(runOperator).not.toHaveBeenCalled();
    expect(notifier.calls).toHaveLength(0);
  });

  it("prefers previousPendingOverride over the candidate trends baseline", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn();

    // Candidate trends say previous=10000, current=11500 → 15% delta (would pass).
    // Override forces the gate to compare against 9000 instead → 27.8% delta → blocked.
    const outcome = await runAutoPublish(
      {
        scopeLabel: "Supreme Court (supreme-court)",
        selector: { supremeCourt: true },
        fetchResult: baseFetchResult("complete", 11500, 10000),
        pendingField: "pendingTotalCases",
        previousPendingOverride: 9000,
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("skipped_review");
    expect(outcome.decision?.reason).toBe("outlier_pending_delta");
    expect(outcome.decision?.previousPending).toBe(9000);
    expect(runOperator).not.toHaveBeenCalled();
    expect(notifier.calls).toHaveLength(1);
  });

  it("ignores a non-finite previousPendingOverride and falls back to candidate trends", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn().mockResolvedValue({ ok: true });

    const outcome = await runAutoPublish(
      {
        scopeLabel: "Supreme Court (supreme-court)",
        selector: { supremeCourt: true },
        fetchResult: baseFetchResult("complete", 10500, 10000),
        pendingField: "pendingTotalCases",
        previousPendingOverride: Number.NaN,
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("published");
    expect(outcome.decision?.previousPending).toBe(10000);
  });

  it("notifies with failure subject when the publish call throws", async () => {
    const notifier = makeNotifier();
    const runOperator = vi.fn().mockRejectedValue(new Error("boom"));

    const outcome = await runAutoPublish(
      {
        scopeLabel: "High Court (delhi)",
        selector: { highCourtCode: "HC-DL" },
        fetchResult: baseFetchResult("complete", 10500, 10000),
        pendingField: "pendingTotalCases",
      },
      { runOperator, notifier },
    );

    expect(outcome.action).toBe("publish_failed");
    expect(outcome.error).toBe("boom");
    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0].subject).toContain("auto-publish failed");
  });
});
