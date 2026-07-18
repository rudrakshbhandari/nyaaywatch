import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD,
  evaluateAutoPublish,
} from "../src/ops/auto-publish-gate.js";

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

  it("blocks sub-20% state moves that are still large in absolute terms", () => {
    // Mirrors Gujarat Jul 9 → Jul 12: +8.8% / +168k under the primary threshold.
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 2_074_967,
      previousPending: 1_906_719,
    });
    expect(decision).toMatchObject({ publish: false, reason: "outlier_pending_delta" });
    expect(decision.deltaFraction).toBeCloseTo(0.088, 2);
  });

  it("blocks when one district concentrates a large pending swing", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 2_074_967,
      previousPending: 1_906_719,
      // Force the absolute secondary off so we exercise the district gate alone.
      absDeltaThreshold: Number.POSITIVE_INFINITY,
      previousDistrictPending: {
        surat: 213_373,
        ahmedabad: 716_718,
      },
      currentDistrictPending: {
        surat: 340_968,
        ahmedabad: 726_237,
      },
    });
    expect(decision).toMatchObject({
      publish: false,
      reason: "outlier_district_pending_delta",
    });
    expect(decision.districtDelta).toMatchObject({
      districtId: "surat",
      previousPending: 213_373,
      currentPending: 340_968,
    });
    expect(decision.districtDelta?.deltaFraction).toBeCloseTo(0.598, 2);
    expect(decision.districtDelta?.stateDeltaShare).toBeGreaterThan(0.5);
  });

  it("publishes when district swings are diffuse across many courts", () => {
    const decision = evaluateAutoPublish({
      qualityState: "complete",
      currentPending: 1_050_000,
      previousPending: 1_000_000,
      previousDistrictPending: {
        a: 200_000,
        b: 200_000,
        c: 200_000,
        d: 200_000,
        e: 200_000,
      },
      currentDistrictPending: {
        a: 210_000,
        b: 210_000,
        c: 210_000,
        d: 210_000,
        e: 210_000,
      },
    });
    expect(decision.publish).toBe(true);
  });
});
