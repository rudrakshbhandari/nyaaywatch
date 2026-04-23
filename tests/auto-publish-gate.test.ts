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
});
