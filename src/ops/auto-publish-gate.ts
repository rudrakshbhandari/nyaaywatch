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
  previousPendingCandidates?: number[];
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

  const previousPending = selectBaseline(options);
  if (previousPending === undefined || previousPending <= 0) {
    return {
      ...base,
      publish: true,
      currentPending: options.currentPending,
    };
  }

  const deltaFraction = Math.abs(options.currentPending - previousPending) / previousPending;
  if (deltaFraction > deltaThreshold) {
    return {
      ...base,
      publish: false,
      reason: "outlier_pending_delta",
      currentPending: options.currentPending,
      previousPending,
      deltaFraction,
    };
  }

  return {
    ...base,
    publish: true,
    currentPending: options.currentPending,
    previousPending,
    deltaFraction,
  };
}

function selectBaseline(options: EvaluateAutoPublishOptions) {
  const candidates = options.previousPendingCandidates?.filter((value) => Number.isFinite(value) && value > 0) ?? [];
  if (candidates.length === 0) {
    return options.previousPending;
  }

  const sorted = [...candidates].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  const lowerMiddle = sorted[middle - 1];
  const upperMiddle = sorted[middle];
  const middleDelta = Math.abs(upperMiddle - lowerMiddle) / lowerMiddle;
  return middleDelta <= (options.deltaThreshold ?? DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD)
    ? (lowerMiddle + upperMiddle) / 2
    : options.previousPending;
}
