import { listPublicStateProfiles } from "../geographies.js";
import { listPublicHighCourtProfiles } from "../high-courts.js";
import { freshnessDays, STALE_SNAPSHOT_THRESHOLD_DAYS } from "../lib/time.js";
import { getSupremeCourtProfile } from "../supreme-court.js";
import { verifyPublicRelease, type ReleaseVerificationSummary } from "./release-verification.js";

export const DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS = 2;
export const PUBLIC_ALPHA_TARGET_SETS = ["all", "smoke"] as const;
const SUCCESSFUL_RUN_STATUSES = new Set(["completed", "published", "replayed"]);
const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const OPERATOR_RUN_FETCH_TIMEOUT_MS = 30_000;
const OPERATOR_RUN_FETCH_RETRY_DELAYS_MS = [250, 1_000];

export type PublicAlphaTargetSet = (typeof PUBLIC_ALPHA_TARGET_SETS)[number];

interface OperatorRunRecord {
  id: string;
  stateCode: string;
  sourceSnapshotAt: string;
  status: string;
  completedAt: string | null;
}

type PublicAlphaOpsTier = "lower_court_state" | "high_court" | "supreme_court";

interface PublicAlphaOpsTargetDescriptor {
  tier: PublicAlphaOpsTier;
  identifier: string;
  label: string;
  stateCode?: string;
  stateName?: string;
  stateSlug?: string;
  courtCode?: string;
  courtName?: string;
  courtSlug?: string;
  verifyOptions: {
    stateSlug?: string;
    highCourtSlug?: string;
    supremeCourt?: boolean;
  };
  runsPath: string;
}

export interface PublicAlphaOpsTargetSummary {
  tier: PublicAlphaOpsTier;
  identifier: string;
  label: string;
  stateCode?: string;
  stateName?: string;
  stateSlug?: string;
  courtCode?: string;
  courtName?: string;
  courtSlug?: string;
  ok: boolean;
  qualityState: ReleaseVerificationSummary["snapshot"]["qualityState"] | null;
  sourceSnapshotAt: string | null;
  publishedAt: string | null;
  currentFreshnessDays: number | null;
  latestSuccessfulRunId: string | null;
  latestSuccessfulRunSourceSnapshotAt: string | null;
  latestSuccessfulRunCompletedAt: string | null;
  latestSuccessfulRunLagDays: number | null;
  staleSnapshotDetected: boolean;
  dailyFetchLagDetected: boolean;
  verification?: ReleaseVerificationSummary;
  error?: string;
}

export interface PublicAlphaOpsStateSummary extends PublicAlphaOpsTargetSummary {
  tier: "lower_court_state";
  stateCode: string;
  stateName: string;
  stateSlug: string;
}

export interface PublicAlphaOpsSummary {
  baseUrl: string;
  checkedAt: string;
  staleSnapshotThresholdDays: number;
  dailyFetchLagThresholdDays: number;
  totalTargets: number;
  healthyTargets: string[];
  staleTargets: string[];
  dailyFetchLagTargets: string[];
  failingTargets: string[];
  targets: PublicAlphaOpsTargetSummary[];
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
    targetSet?: PublicAlphaTargetSet;
  } = {},
): Promise<PublicAlphaOpsSummary> {
  const checkedAt = options.now ?? new Date();
  const dailyFetchLagThresholdDays = options.dailyFetchLagThresholdDays ?? DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS;
  const targetSet = options.targetSet ?? "all";
  if (!options.operatorToken?.trim()) {
    throw new Error("verifyPublicAlphaOperations requires an operator token so daily internal fetch cadence is measured from operator run history.");
  }
  const targets: PublicAlphaOpsTargetSummary[] = [];

  for (const target of buildPublicReleaseTargets(targetSet)) {
    try {
      const verification = await verifyPublicRelease(baseUrl, {
        ...target.verifyOptions,
        now: checkedAt,
      });
      const latestSuccessfulRun = await fetchLatestSuccessfulRun(baseUrl, target, options.operatorToken);
      const currentFreshnessDays = verification.snapshot.currentFreshnessDays;
      const staleSnapshotDetected =
        verification.snapshot.qualityState === "stale" || currentFreshnessDays > STALE_SNAPSHOT_THRESHOLD_DAYS;
      const latestSuccessfulRunLagDays = latestSuccessfulRun ? latestSuccessfulRunAgeDays(latestSuccessfulRun, checkedAt) : null;
      const dailyFetchLagDetected =
        latestSuccessfulRunLagDays === null || latestSuccessfulRunLagDays > dailyFetchLagThresholdDays;
      targets.push({
        tier: target.tier,
        identifier: target.identifier,
        label: target.label,
        stateCode: target.stateCode,
        stateName: target.stateName,
        stateSlug: target.stateSlug,
        courtCode: target.courtCode,
        courtName: target.courtName,
        courtSlug: target.courtSlug,
        ok: !staleSnapshotDetected && !dailyFetchLagDetected,
        qualityState: verification.snapshot.qualityState,
        sourceSnapshotAt: verification.snapshot.sourceSnapshotAt,
        publishedAt: verification.snapshot.publishedAt,
        currentFreshnessDays,
        latestSuccessfulRunId: latestSuccessfulRun?.id ?? null,
        latestSuccessfulRunSourceSnapshotAt: latestSuccessfulRun?.sourceSnapshotAt ?? null,
        latestSuccessfulRunCompletedAt: latestSuccessfulRun?.completedAt ?? null,
        latestSuccessfulRunLagDays,
        staleSnapshotDetected,
        dailyFetchLagDetected,
        verification,
      });
    } catch (error) {
      targets.push({
        tier: target.tier,
        identifier: target.identifier,
        label: target.label,
        stateCode: target.stateCode,
        stateName: target.stateName,
        stateSlug: target.stateSlug,
        courtCode: target.courtCode,
        courtName: target.courtName,
        courtSlug: target.courtSlug,
        ok: false,
        qualityState: null,
        sourceSnapshotAt: null,
        publishedAt: null,
        currentFreshnessDays: null,
        latestSuccessfulRunId: null,
        latestSuccessfulRunSourceSnapshotAt: null,
        latestSuccessfulRunCompletedAt: null,
        latestSuccessfulRunLagDays: null,
        staleSnapshotDetected: false,
        dailyFetchLagDetected: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const states = targets.filter((target): target is PublicAlphaOpsStateSummary => target.tier === "lower_court_state");

  return {
    baseUrl: baseUrl.trim().replace(/\/+$/, ""),
    checkedAt: checkedAt.toISOString(),
    staleSnapshotThresholdDays: STALE_SNAPSHOT_THRESHOLD_DAYS,
    dailyFetchLagThresholdDays,
    totalTargets: targets.length,
    healthyTargets: targets.filter((target) => target.ok).map(formatTargetIdentifier),
    staleTargets: targets.filter((target) => target.staleSnapshotDetected).map(formatTargetIdentifier),
    dailyFetchLagTargets: targets.filter((target) => target.dailyFetchLagDetected).map(formatTargetIdentifier),
    failingTargets: targets.filter((target) => target.error).map(formatTargetIdentifier),
    targets,
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

  if (summary.failingTargets.length > 0) {
    failures.push(`verification failures: ${summary.failingTargets.join(", ")}`);
  }

  if (summary.staleTargets.length > 0) {
    failures.push(`stale public snapshots: ${summary.staleTargets.join(", ")}`);
  }

  if (summary.dailyFetchLagTargets.length > 0) {
    failures.push(`daily internal fetch lag: ${summary.dailyFetchLagTargets.join(", ")}`);
  }

  if (failures.length === 0) {
    return;
  }

  throw new Error(`Public alpha operations check failed: ${failures.join("; ")}`);
}

function buildPublicReleaseTargets(targetSet: PublicAlphaTargetSet): PublicAlphaOpsTargetDescriptor[] {
  const stateTargets = listPublicStateProfiles().map((profile) => ({
    tier: "lower_court_state" as const,
    identifier: profile.stateCode,
    label: profile.stateName,
    stateCode: profile.stateCode,
    stateName: profile.stateName,
    stateSlug: profile.stateSlug,
    verifyOptions: { stateSlug: profile.stateSlug },
    runsPath: `/operator/runs?stateCode=${encodeURIComponent(profile.stateCode)}`,
  }));
  const highCourtTargets = listPublicHighCourtProfiles().map((profile) => ({
    tier: "high_court" as const,
    identifier: profile.courtCode,
    label: profile.courtName,
    courtCode: profile.courtCode,
    courtName: profile.courtName,
    courtSlug: profile.courtSlug,
    verifyOptions: { highCourtSlug: profile.courtSlug },
    runsPath: `/operator/high-courts/${profile.courtSlug}/runs`,
  }));
  const supremeCourt = getSupremeCourtProfile();
  const supremeCourtTargets = supremeCourt.publicBeta
    ? [
        {
          tier: "supreme_court" as const,
          identifier: supremeCourt.courtCode,
          label: supremeCourt.courtName,
          courtCode: supremeCourt.courtCode,
          courtName: supremeCourt.courtName,
          courtSlug: supremeCourt.courtSlug,
          verifyOptions: { supremeCourt: true },
          runsPath: "/operator/supreme-court/runs",
        },
      ]
    : [];

  if (targetSet === "smoke") {
    const legacyDefaultState = stateTargets.find((target) => target.stateCode === "HP") ?? stateTargets[0];
    const stateScopedSurface = stateTargets.find((target) => target.stateCode && target.stateCode !== "HP");
    return [
      ...dedupeTargets([legacyDefaultState, stateScopedSurface]),
      ...dedupeTargets([highCourtTargets[0], supremeCourtTargets[0]]),
    ];
  }

  return [...stateTargets, ...highCourtTargets, ...supremeCourtTargets];
}

function dedupeTargets(targets: Array<PublicAlphaOpsTargetDescriptor | undefined>) {
  const seen = new Set<string>();
  return targets.filter((target): target is PublicAlphaOpsTargetDescriptor => {
    if (!target) {
      return false;
    }
    const key = `${target.tier}:${target.identifier}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchLatestSuccessfulRun(
  baseUrl: string,
  target: PublicAlphaOpsTargetDescriptor,
  operatorToken: string,
): Promise<OperatorRunRecord | null> {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const url = `${normalizedBaseUrl}${target.runsPath}`;
  const response = await fetchOperatorRunHistoryWithRetry(url, operatorToken);

  if (!response.ok) {
    throw new Error(`Expected ${url} to return 200, received ${response.status}`);
  }

  const payload = (await response.json()) as { runs?: unknown };
  const runs = Array.isArray(payload.runs) ? payload.runs : [];
  const latestSuccessfulRun = runs.find(isSuccessfulOperatorRun);
  return latestSuccessfulRun ?? null;
}

async function fetchOperatorRunHistoryWithRetry(url: string, operatorToken: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= OPERATOR_RUN_FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-operator-token": operatorToken,
        },
        signal: AbortSignal.timeout(OPERATOR_RUN_FETCH_TIMEOUT_MS),
      });
      if (response.ok || !TRANSIENT_HTTP_STATUSES.has(response.status)) {
        return response;
      }
      if (attempt === OPERATOR_RUN_FETCH_RETRY_DELAYS_MS.length) {
        return response;
      }
      lastError = new Error(`Transient HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    const delayMs = OPERATOR_RUN_FETCH_RETRY_DELAYS_MS[attempt];
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to fetch ${url} after transient retries: ${message}`);
}

function formatTargetIdentifier(target: Pick<PublicAlphaOpsTargetSummary, "tier" | "identifier">) {
  if (target.tier === "lower_court_state") {
    return target.identifier;
  }

  return `${target.tier}:${target.identifier}`;
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

function latestSuccessfulRunAgeDays(run: OperatorRunRecord, checkedAt: Date) {
  // Completion time is the real cadence signal; source snapshot date can stay older
  // when the internal scheduler reruns without changing the upstream day's data.
  const measuredAt = run.completedAt ?? run.sourceSnapshotAt;
  return freshnessDays(measuredAt, checkedAt);
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
