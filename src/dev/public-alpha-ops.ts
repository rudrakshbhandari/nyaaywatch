import { listPublicStateProfiles } from "../geographies.js";
import { freshnessDays, STALE_SNAPSHOT_THRESHOLD_DAYS } from "../lib/time.js";
import { verifyPublicRelease, type ReleaseVerificationSummary } from "./release-verification.js";

export const DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS = 2;
const SUCCESSFUL_RUN_STATUSES = new Set(["completed", "published", "replayed"]);

interface OperatorRunRecord {
  id: string;
  stateCode: string;
  sourceSnapshotAt: string;
  status: string;
  completedAt: string | null;
}

export interface PublicAlphaOpsStateSummary {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  ok: boolean;
  qualityState: ReleaseVerificationSummary["snapshot"]["qualityState"] | null;
  sourceSnapshotAt: string | null;
  publishedAt: string | null;
  currentFreshnessDays: number | null;
  latestSuccessfulRunId: string | null;
  latestSuccessfulRunSourceSnapshotAt: string | null;
  latestSuccessfulRunCompletedAt: string | null;
  latestSuccessfulRunFreshnessDays: number | null;
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
    operatorToken?: string;
  } = {},
): Promise<PublicAlphaOpsSummary> {
  const checkedAt = options.now ?? new Date();
  const dailyFetchLagThresholdDays = options.dailyFetchLagThresholdDays ?? DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS;
  if (!options.operatorToken?.trim()) {
    throw new Error("verifyPublicAlphaOperations requires an operator token so daily internal fetch cadence is measured from operator run history.");
  }
  const states: PublicAlphaOpsStateSummary[] = [];

  for (const profile of listPublicStateProfiles()) {
    try {
      const verification = await verifyPublicRelease(baseUrl, {
        stateSlug: profile.stateSlug,
        now: checkedAt,
      });
      const latestSuccessfulRun = await fetchLatestSuccessfulRun(baseUrl, profile.stateCode, options.operatorToken);
      const currentFreshnessDays = verification.snapshot.currentFreshnessDays;
      const staleSnapshotDetected =
        verification.snapshot.qualityState === "stale" || currentFreshnessDays > STALE_SNAPSHOT_THRESHOLD_DAYS;
      const latestSuccessfulRunFreshnessDays = latestSuccessfulRun
        ? freshnessDays(latestSuccessfulRun.sourceSnapshotAt, checkedAt)
        : null;
      const dailyFetchLagDetected =
        latestSuccessfulRunFreshnessDays === null || latestSuccessfulRunFreshnessDays > dailyFetchLagThresholdDays;
      states.push({
        stateCode: profile.stateCode,
        stateName: profile.stateName,
        stateSlug: profile.stateSlug,
        ok: !staleSnapshotDetected && !dailyFetchLagDetected,
        qualityState: verification.snapshot.qualityState,
        sourceSnapshotAt: verification.snapshot.sourceSnapshotAt,
        publishedAt: verification.snapshot.publishedAt,
        currentFreshnessDays,
        latestSuccessfulRunId: latestSuccessfulRun?.id ?? null,
        latestSuccessfulRunSourceSnapshotAt: latestSuccessfulRun?.sourceSnapshotAt ?? null,
        latestSuccessfulRunCompletedAt: latestSuccessfulRun?.completedAt ?? null,
        latestSuccessfulRunFreshnessDays,
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
        latestSuccessfulRunId: null,
        latestSuccessfulRunSourceSnapshotAt: null,
        latestSuccessfulRunCompletedAt: null,
        latestSuccessfulRunFreshnessDays: null,
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

async function fetchLatestSuccessfulRun(baseUrl: string, stateCode: string, operatorToken: string): Promise<OperatorRunRecord | null> {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const response = await fetch(`${normalizedBaseUrl}/operator/runs?stateCode=${encodeURIComponent(stateCode)}`, {
    headers: {
      accept: "application/json",
      "x-operator-token": operatorToken,
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Expected ${normalizedBaseUrl}/operator/runs?stateCode=${stateCode} to return 200, received ${response.status}`);
  }

  const payload = (await response.json()) as { runs?: unknown };
  const runs = Array.isArray(payload.runs) ? payload.runs : [];
  const latestSuccessfulRun = runs.find(isSuccessfulOperatorRun);
  return latestSuccessfulRun ?? null;
}

function isSuccessfulOperatorRun(value: unknown): value is OperatorRunRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<OperatorRunRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.stateCode === "string" &&
    typeof record.sourceSnapshotAt === "string" &&
    typeof record.status === "string" &&
    SUCCESSFUL_RUN_STATUSES.has(record.status) &&
    (typeof record.completedAt === "string" || record.completedAt === null)
  );
}
