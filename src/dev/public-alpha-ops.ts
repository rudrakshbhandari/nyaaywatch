import { listPublicStateProfiles } from "../geographies.js";
import { STALE_SNAPSHOT_THRESHOLD_DAYS } from "../lib/time.js";
import { verifyPublicRelease, type ReleaseVerificationSummary } from "./release-verification.js";

export const DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS = 2;

export interface PublicAlphaOpsStateSummary {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  ok: boolean;
  qualityState: ReleaseVerificationSummary["snapshot"]["qualityState"] | null;
  sourceSnapshotAt: string | null;
  publishedAt: string | null;
  currentFreshnessDays: number | null;
  staleSnapshotDetected: boolean;
  dailyFetchLagDetected: boolean;
  verification?: ReleaseVerificationSummary;
  error?: string;
}

export interface PublicAlphaOpsSummary {
  baseUrl: string;
  checkedAt: string;
  staleSnapshotThresholdDays: number;
  dailyFetchLagThresholdDays: number;
  totalStates: number;
  healthyStates: string[];
  staleStates: string[];
  dailyFetchLagStates: string[];
  failingStates: string[];
  states: PublicAlphaOpsStateSummary[];
}

export async function verifyPublicAlphaOperations(
  baseUrl: string,
  options: {
    now?: Date;
    dailyFetchLagThresholdDays?: number;
  } = {},
): Promise<PublicAlphaOpsSummary> {
  const checkedAt = options.now ?? new Date();
  const dailyFetchLagThresholdDays = options.dailyFetchLagThresholdDays ?? DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS;
  const states: PublicAlphaOpsStateSummary[] = [];

  for (const profile of listPublicStateProfiles()) {
    try {
      const verification = await verifyPublicRelease(baseUrl, {
        stateSlug: profile.stateSlug,
        now: checkedAt,
      });
      const currentFreshnessDays = verification.snapshot.currentFreshnessDays;
      const staleSnapshotDetected =
        verification.snapshot.qualityState === "stale" || currentFreshnessDays > STALE_SNAPSHOT_THRESHOLD_DAYS;
      const dailyFetchLagDetected = currentFreshnessDays > dailyFetchLagThresholdDays;
      states.push({
        stateCode: profile.stateCode,
        stateName: profile.stateName,
        stateSlug: profile.stateSlug,
        ok: !staleSnapshotDetected && !dailyFetchLagDetected,
        qualityState: verification.snapshot.qualityState,
        sourceSnapshotAt: verification.snapshot.sourceSnapshotAt,
        publishedAt: verification.snapshot.publishedAt,
        currentFreshnessDays,
        staleSnapshotDetected,
        dailyFetchLagDetected,
        verification,
      });
    } catch (error) {
      states.push({
        stateCode: profile.stateCode,
        stateName: profile.stateName,
        stateSlug: profile.stateSlug,
        ok: false,
        qualityState: null,
        sourceSnapshotAt: null,
        publishedAt: null,
        currentFreshnessDays: null,
        staleSnapshotDetected: false,
        dailyFetchLagDetected: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    baseUrl: baseUrl.trim().replace(/\/+$/, ""),
    checkedAt: checkedAt.toISOString(),
    staleSnapshotThresholdDays: STALE_SNAPSHOT_THRESHOLD_DAYS,
    dailyFetchLagThresholdDays,
    totalStates: states.length,
    healthyStates: states.filter((state) => state.ok).map((state) => state.stateCode),
    staleStates: states.filter((state) => state.staleSnapshotDetected).map((state) => state.stateCode),
    dailyFetchLagStates: states.filter((state) => state.dailyFetchLagDetected).map((state) => state.stateCode),
    failingStates: states.filter((state) => state.error).map((state) => state.stateCode),
    states,
  };
}

export function assertPublicAlphaOperationsHealthy(summary: PublicAlphaOpsSummary) {
  const failures: string[] = [];

  if (summary.failingStates.length > 0) {
    failures.push(`verification failures: ${summary.failingStates.join(", ")}`);
  }

  if (summary.staleStates.length > 0) {
    failures.push(`stale public snapshots: ${summary.staleStates.join(", ")}`);
  }

  if (summary.dailyFetchLagStates.length > 0) {
    failures.push(`daily internal fetch lag: ${summary.dailyFetchLagStates.join(", ")}`);
  }

  if (failures.length === 0) {
    return;
  }

  throw new Error(`Public alpha operations check failed: ${failures.join("; ")}`);
}
