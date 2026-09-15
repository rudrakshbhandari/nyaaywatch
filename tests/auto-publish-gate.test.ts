import { describe, expect, it } from "vitest";

import { DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD, evaluateAutoPublish } from "../src/ops/auto-publish-gate.js";

describe("evaluateAutoPublish", () => {
  it("refuses to publish when quality is not complete", () => {
    const decision = evaluateAutoPublish({ qualityState: "partial", currentPending: 1000 });
    expect(decision).toMatchObject({ publish: false, reason: "quality_not_complete" });
  });

  it("refuses to publish when current pending is missing", () => {
    const decision = evaluateAutoPublish({ qualityState: "complete" });
    expect(decision).toMatchObject({ publish: false, reason: "current_pending_missing" });
  });

  it("publishes when no previous snapshot exists", () => {
    const decision = evaluateAutoPublish({ qualityState: "complete", currentPending: 8500 });
    expect(decision.publish).toBe(true);
    expect(decision.currentPending).toBe(8500);
    expect(decision.previousPending).toBeUndefined();
  });

  it("publishes when delta is within threshold", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 10500,
      previousPending: 10000,
    });
    expect(decision.publish).toBe(true);
    expect(decision.deltaFraction).toBeCloseTo(0.05, 5);
  });

  it("skips publish when delta exceeds threshold", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 20000,
      previousPending: 10000,
    });
    expect(decision).toMatchObject({ publish: false, reason: "outlier_pending_delta" });
    expect(decision.deltaFraction).toBeCloseTo(1, 5);
  });

  it("respects custom threshold", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 10500,
      previousPending: 10000,
      deltaThreshold: 0.01,
    });
    expect(decision).toMatchObject({ publish: false, reason: "outlier_pending_delta" });
    expect(decision.deltaThreshold).toBe(0.01);
  });

  it("uses default threshold when none provided", () => {
    const decision = evaluateAutoPublish({ qualityState: "complete", currentPending: 1000 });
    expect(decision.deltaThreshold).toBe(DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD);
  });

  it("uses the median of recent history so one bad publication does not poison the baseline", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 1027146,
      previousPendingCandidates: [1031353, 1031347, 1031702, 849713],
    });

    expect(decision).toMatchObject({ publish: true, previousPending: 1031350 });
    expect(decision.deltaFraction).toBeCloseTo(0.0041, 4);
  });

  it("still holds a genuine jump from a stable recent baseline", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 13000,
      previousPendingCandidates: [9900, 10000, 10100],
    });

    expect(decision).toMatchObject({ publish: false, reason: "outlier_pending_delta", previousPending: 10000 });
    expect(decision.deltaFraction).toBeCloseTo(0.3, 5);
  });

  it("does not invent a midpoint baseline when even history disagrees", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 150,
      previousPending: 200,
      previousPendingCandidates: [100, 200],
    });

    expect(decision).toMatchObject({ publish: false, reason: "outlier_pending_delta", previousPending: 200 });
    expect(decision.deltaFraction).toBeCloseTo(0.25, 5);
  });
});
