export const DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD = 0.2;

/**
 * Secondary absolute+fractional floor for state pending moves that stay under
 * the primary 20% threshold but are still large enough to hide a concentrated
 * reporting correction (e.g. Gujarat Jul 9→12: +8.8% / +168k).
 */
export const DEFAULT_AUTO_PUBLISH_ABS_DELTA_THRESHOLD = 100_000;
export const DEFAULT_AUTO_PUBLISH_ABS_FRACTION_FLOOR = 0.05;

/**
 * Lower-court district concentration gate. Blocks when one district both
 * swings hard and accounts for most of the state-level pending move
 * (e.g. Surat +60% driving nearly all of Gujarat's Jul 12 spike).
 */
export const DEFAULT_DISTRICT_DELTA_THRESHOLD = 0.4;
export const DEFAULT_DISTRICT_ABS_DELTA_FLOOR = 25_000;
export const DEFAULT_DISTRICT_STATE_SHARE_THRESHOLD = 0.5;

export type AutoPublishSkipReason =
  | "quality_not_complete"
  | "current_pending_missing"
  | "outlier_pending_delta"
  | "outlier_district_pending_delta";

export interface DistrictPendingDelta {
  districtId: string;
  previousPending: number;
  currentPending: number;
  deltaFraction: number;
  stateDeltaShare: number;
}

export interface AutoPublishDecision {
  publish: boolean;
  reason?: AutoPublishSkipReason;
  qualityState: string;
  currentPending?: number;
  previousPending?: number;
  deltaFraction?: number;
  deltaThreshold: number;
  districtDelta?: DistrictPendingDelta;
}

export interface EvaluateAutoPublishOptions {
  qualityState: string;
  currentPending?: number;
  previousPending?: number;
  deltaThreshold?: number;
  absDeltaThreshold?: number;
  absFractionFloor?: number;
  currentDistrictPending?: Record<string, number>;
  previousDistrictPending?: Record<string, number>;
  districtDeltaThreshold?: number;
  districtAbsDeltaFloor?: number;
  districtStateShareThreshold?: number;
}

export function evaluateAutoPublish(options: EvaluateAutoPublishOptions): AutoPublishDecision {
  const deltaThreshold = options.deltaThreshold ?? DEFAULT_AUTO_PUBLISH_DELTA_THRESHOLD;
  const absDeltaThreshold = options.absDeltaThreshold ?? DEFAULT_AUTO_PUBLISH_ABS_DELTA_THRESHOLD;
  const absFractionFloor = options.absFractionFloor ?? DEFAULT_AUTO_PUBLISH_ABS_FRACTION_FLOOR;
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

  const deltaFraction =
    Math.abs(options.currentPending - options.previousPending) / options.previousPending;
  const absDelta = Math.abs(options.currentPending - options.previousPending);

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

  if (deltaFraction > absFractionFloor && absDelta > absDeltaThreshold) {
    return {
      ...base,
      publish: false,
      reason: "outlier_pending_delta",
      currentPending: options.currentPending,
      previousPending: options.previousPending,
      deltaFraction,
    };
  }

  const districtDelta = findConcentratedDistrictDelta({
    currentPending: options.currentPending,
    previousPending: options.previousPending,
    currentDistrictPending: options.currentDistrictPending,
    previousDistrictPending: options.previousDistrictPending,
    districtDeltaThreshold: options.districtDeltaThreshold ?? DEFAULT_DISTRICT_DELTA_THRESHOLD,
    districtAbsDeltaFloor: options.districtAbsDeltaFloor ?? DEFAULT_DISTRICT_ABS_DELTA_FLOOR,
    districtStateShareThreshold:
      options.districtStateShareThreshold ?? DEFAULT_DISTRICT_STATE_SHARE_THRESHOLD,
  });

  if (districtDelta) {
    return {
      ...base,
      publish: false,
      reason: "outlier_district_pending_delta",
      currentPending: options.currentPending,
      previousPending: options.previousPending,
      deltaFraction,
      districtDelta,
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

function findConcentratedDistrictDelta(options: {
  currentPending: number;
  previousPending: number;
  currentDistrictPending?: Record<string, number>;
  previousDistrictPending?: Record<string, number>;
  districtDeltaThreshold: number;
  districtAbsDeltaFloor: number;
  districtStateShareThreshold: number;
}): DistrictPendingDelta | undefined {
  const currentMap = options.currentDistrictPending;
  const previousMap = options.previousDistrictPending;
  if (!currentMap || !previousMap) {
    return undefined;
  }

  // Walk the union so NJDG add / rename / drop events are compared even when
  // the district ID exists on only one side of the publication boundary.
  const districtIds = new Set([...Object.keys(previousMap), ...Object.keys(currentMap)]);
  const stateAbsDelta = Math.abs(options.currentPending - options.previousPending);

  let worst: DistrictPendingDelta | undefined;

  for (const districtId of districtIds) {
    const previousPending = previousMap[districtId] ?? 0;
    const currentPending = currentMap[districtId] ?? 0;
    if (!Number.isFinite(previousPending) || !Number.isFinite(currentPending)) {
      continue;
    }
    if (previousPending <= 0 && currentPending <= 0) {
      continue;
    }

    const districtAbsDelta = Math.abs(currentPending - previousPending);
    if (districtAbsDelta < options.districtAbsDeltaFloor) {
      continue;
    }

    // Appearing from nothing is a full swing for gate purposes.
    const districtDeltaFraction =
      previousPending > 0 ? districtAbsDelta / previousPending : 1;
    if (districtDeltaFraction <= options.districtDeltaThreshold) {
      continue;
    }

    // When state pending is flat (e.g. a rename), still treat a large unmatched
    // district as owning the whole local swing so it requires review.
    const stateDeltaShare = stateAbsDelta > 0 ? districtAbsDelta / stateAbsDelta : 1;
    if (stateDeltaShare < options.districtStateShareThreshold) {
      continue;
    }

    const candidate: DistrictPendingDelta = {
      districtId,
      previousPending,
      currentPending,
      deltaFraction: districtDeltaFraction,
      stateDeltaShare,
    };
    if (!worst || candidate.stateDeltaShare > worst.stateDeltaShare) {
      worst = candidate;
    }
  }

  return worst;
}
