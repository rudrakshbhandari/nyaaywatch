export const DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD = 0.2;

export type AutoPublishSkipReason =
  | "quality_not_complete"
  | "current_pending_missing"
  | "outlier_pending_delta";

export interface AutoPublishDecision {
  publish: boolean;
  reason?: AutoPublishSkipReason;
  qualityState: string;
  currentPending?: number;
  previousPending?: number;
  deltaFraction?: number;
  deltaThreshold: number;
}

export interface EvaluateAutoPublishOptions {
  qualityState: string;
  currentPending?: number;
  previousPending?: number;
  deltaThreshold?: number;
}

export function evaluateAutoPublish(options: EvaluateAutoPublishOptions): AutoPublishDecision {
  const deltaThreshold = options.deltaThreshold ?? DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD;
  const base = { qualityState: options.qualityState, deltaThreshold } as const;

  if (options.qualityState !== "complete") {
    return { ...base, publish: false, reason: "quality_not_complete" };
  }

  if (options.currentPending === undefined || !Number.isFinite(options.currentPending)) {
    return { ...base, publish: false, reason: "current_pending_missing" };
  }

  if (options.previousPending === undefined || options.previousPending <= 0) {
    return {
      ...base,
      publish: true,
      currentPending: options.currentPending,
    };
  }

  const deltaFraction = Math.abs(options.currentPending - options.previousPending) / options.previousPending;
  if (deltaFraction > deltaThreshold) {
    return {
      ...base,
      publish: false,
      reason: "outlier_pending_delta",
      currentPending: options.currentPending,
      previousPending: options.previousPending,
      deltaFraction,
    };
  }

  return {
    ...base,
    publish: true,
    currentPending: options.currentPending,
    previousPending: options.previousPending,
    deltaFraction,
  };
}
