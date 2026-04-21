import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { listStateProfiles, type NjdgStateProfile } from "../geographies.js";
import type { HighCourtProfile } from "../high-courts.js";
import { getReviewedSupremeCourtProfileForScheduledFetch } from "./scheduled-fetch-targets.js";
import { readFlag } from "./cli-flags.js";
import { freshnessDays } from "../lib/time.js";
import { listReviewedHighCourtProfilesForScheduledFetch } from "./scheduled-fetch-targets.js";

const execFileAsync = promisify(execFile);
const AWS_MAX_BUFFER = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;
const SUCCESSFUL_RUN_STATUSES = new Set(["completed", "published", "replayed"]);

export const DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION = "ap-south-1";
export const DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK = "nyaaywatch-staging";
export const DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS = 2;

export const DEFAULT_STATE_SCHEDULE_NAME_SUFFIX = "weekday-internal-fetch";
export const DEFAULT_SUPREME_COURT_SCHEDULE_NAME_SUFFIX = "supreme-court-internal-fetch";
export const DEFAULT_HIGH_COURT_SCHEDULE_NAME_SUFFIX = "high-courts-internal-fetch";

export const DEFAULT_STATE_FETCH_NOTE_PREFIX = "Scheduled daily lower-court internal raw fetch";
export const DEFAULT_SUPREME_COURT_FETCH_NOTE_PREFIX = "Scheduled daily Supreme Court internal raw fetch";
export const DEFAULT_HIGH_COURT_FETCH_NOTE_PREFIX = "Scheduled daily High Court internal raw fetch";

const DEFAULT_SCHEDULE_GROUP_NAME = "default";

const TIER_CONFIG = {
  lower_courts: {
    scopeType: "state",
    entrypointPath: "dist/src/dev/ecs-scheduled-fetch-entrypoint.js",
    defaultNotePrefix: DEFAULT_STATE_FETCH_NOTE_PREFIX,
    defaultNameSuffix: DEFAULT_STATE_SCHEDULE_NAME_SUFFIX,
  },
  supreme_court: {
    scopeType: "supreme_court",
    entrypointPath: "dist/src/dev/ecs-scheduled-supreme-court-fetch-entrypoint.js",
    defaultNotePrefix: DEFAULT_SUPREME_COURT_FETCH_NOTE_PREFIX,
    defaultNameSuffix: DEFAULT_SUPREME_COURT_SCHEDULE_NAME_SUFFIX,
  },
  high_courts: {
    scopeType: "high_court",
    entrypointPath: "dist/src/dev/ecs-scheduled-high-court-fetch-entrypoint.js",
    defaultNotePrefix: DEFAULT_HIGH_COURT_FETCH_NOTE_PREFIX,
    defaultNameSuffix: DEFAULT_HIGH_COURT_SCHEDULE_NAME_SUFFIX,
  },
} as const;

type InternalFetchScheduleTier = keyof typeof TIER_CONFIG;

interface SchedulerTargetSummary {
  Arn?: string;
  RoleArn?: string;
  Input?: string;
  EcsParameters?: {
    TaskDefinitionArn?: string;
  };
}

interface ScheduleSummary {
  Arn?: string;
  Name?: string;
  GroupName?: string;
  State?: string;
  ScheduleExpression?: string;
  ScheduleExpressionTimezone?: string;
  Description?: string;
  CreationDate?: string;
  LastModificationDate?: string;
  Target?: SchedulerTargetSummary;
}

interface ServiceSummary {
  serviceArn?: string;
  serviceName?: string;
  clusterArn?: string;
  taskDefinition?: string;
}

interface ScheduledOperatorRun {
  id: string;
  status: string;
  note: string | null;
  sourceSnapshotAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
  stateCode?: string | null;
  scopeType?: string | null;
  scopeCode?: string | null;
}

type LowerCourtAnchor = {
  tier: "lower_courts";
  stateCode: string;
  stateSlug: string;
  stateName: string;
};

type SupremeCourtAnchor = {
  tier: "supreme_court";
  courtCode: string;
  courtSlug: string;
  courtName: string;
};

type HighCourtAnchor = {
  tier: "high_courts";
  courtCode: string;
  courtSlug: string;
  courtName: string;
  coveredGeographies: HighCourtProfile["coveredGeographies"];
};

type TierAnchor = LowerCourtAnchor | SupremeCourtAnchor | HighCourtAnchor;

export interface InternalFetchTierSummary {
  tier: InternalFetchScheduleTier;
  scopeType: (typeof TIER_CONFIG)[InternalFetchScheduleTier]["scopeType"];
  scheduleName: string;
  scheduleGroupName: string;
  scheduleArn: string | null;
  scheduleState: string | null;
  scheduleExpression: string | null;
  scheduleExpressionTimezone: string | null;
  scheduleRoleArn: string | null;
  notePrefix: string;
  liveTaskDefinitionArn: string | null;
  scheduleTaskDefinitionArn: string | null;
  schedulerTargetMatchesService: boolean;
  usesScheduledFetchEntrypoint: boolean;
  scheduledFetchCommand: string[];
  entrypointPath: string;
  latestScheduledRunId: string | null;
  latestScheduledRunStatus: string | null;
  latestScheduledRunNote: string | null;
  latestScheduledRunSourceSnapshotAt: string | null;
  latestScheduledRunCreatedAt: string | null;
  latestScheduledRunCompletedAt: string | null;
  latestScheduledRunFreshnessDays: number | null;
  scheduleUpdatedAt: string | null;
  scheduleUpdatedFreshnessDays: number | null;
  scheduleExecutionLagDetected: boolean;
  configHealthy: boolean;
  executionHealthy: boolean;
  ok: boolean;
  anchor: TierAnchor;
}

export interface InternalFetchScheduleWatchdogSummary {
  baseUrl: string;
  checkedAt: string;
  region: string;
  stackName: string;
  scheduleGroupName: string;
  scheduleExecutionLagThresholdDays: number;
  clusterArn: string | null;
  serviceName: string | null;
  liveTaskDefinitionArn: string | null;
  ok: boolean;
  failingTiers: InternalFetchScheduleTier[];
  tiers: InternalFetchTierSummary[];
}

export function parseInternalFetchScheduleWatchdogOptions(args: string[]) {
  return {
    baseUrl: readFlag(args, "--base-url") ?? process.env.BASE_URL,
    region: readFlag(args, "--region") ?? process.env.AWS_REGION ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION,
    stackName: readFlag(args, "--stack-name") ?? process.env.STACK_NAME ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK,
    scheduleGroupName: readFlag(args, "--schedule-group-name") ?? process.env.INTERNAL_FETCH_SCHEDULE_GROUP_NAME ?? DEFAULT_SCHEDULE_GROUP_NAME,
    stateScheduleName:
      readFlag(args, "--state-schedule-name") ??
      process.env.STATE_INTERNAL_FETCH_SCHEDULE_NAME ??
      `${readFlag(args, "--stack-name") ?? process.env.STACK_NAME ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK}-${DEFAULT_STATE_SCHEDULE_NAME_SUFFIX}`,
    supremeCourtScheduleName:
      readFlag(args, "--supreme-court-schedule-name") ??
      process.env.SUPREME_COURT_INTERNAL_FETCH_SCHEDULE_NAME ??
      `${readFlag(args, "--stack-name") ?? process.env.STACK_NAME ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK}-${DEFAULT_SUPREME_COURT_SCHEDULE_NAME_SUFFIX}`,
    highCourtScheduleName:
      readFlag(args, "--high-court-schedule-name") ??
      process.env.HIGH_COURT_INTERNAL_FETCH_SCHEDULE_NAME ??
      `${readFlag(args, "--stack-name") ?? process.env.STACK_NAME ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK}-${DEFAULT_HIGH_COURT_SCHEDULE_NAME_SUFFIX}`,
    scheduleExecutionLagThresholdDays:
      readNumberFlag(args, "--schedule-execution-lag-days") ?? DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS,
    operatorToken: process.env.OPERATOR_API_TOKEN,
  };
}

export async function verifyInternalFetchSchedules(
  baseUrl: string,
  options: {
    now?: Date;
    region?: string;
    stackName?: string;
    scheduleGroupName?: string;
    stateScheduleName?: string;
    supremeCourtScheduleName?: string;
    highCourtScheduleName?: string;
    scheduleExecutionLagThresholdDays?: number;
    operatorToken?: string;
  } = {},
): Promise<InternalFetchScheduleWatchdogSummary> {
  if (!options.operatorToken?.trim()) {
    throw new Error("verifyInternalFetchSchedules requires OPERATOR_API_TOKEN so recent scheduled operator runs can be checked.");
  }

  const checkedAt = options.now ?? new Date();
  const region = options.region ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION;
  const stackName = options.stackName ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK;
  const scheduleGroupName = options.scheduleGroupName ?? DEFAULT_SCHEDULE_GROUP_NAME;
  const stateScheduleName = options.stateScheduleName ?? `${stackName}-${DEFAULT_STATE_SCHEDULE_NAME_SUFFIX}`;
  const supremeCourtScheduleName = options.supremeCourtScheduleName ?? `${stackName}-${DEFAULT_SUPREME_COURT_SCHEDULE_NAME_SUFFIX}`;
  const highCourtScheduleName = options.highCourtScheduleName ?? `${stackName}-${DEFAULT_HIGH_COURT_SCHEDULE_NAME_SUFFIX}`;
  const scheduleExecutionLagThresholdDays =
    options.scheduleExecutionLagThresholdDays ?? DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS;

  const lowerCourtAnchor = resolveLowerCourtAnchor();
  const supremeCourtAnchor = resolveSupremeCourtAnchor();
  const highCourtAnchor = resolveHighCourtAnchor();

  const clusterName = await fetchClusterName(stackName, region);
  const serviceName = await fetchServiceName(stackName, region);
  const [service, lowerCourtSchedule, supremeCourtSchedule, highCourtSchedule, lowerCourtRuns, supremeCourtRuns, highCourtRuns] =
    await Promise.all([
      fetchService(clusterName, serviceName, region),
      fetchSchedule(stateScheduleName, scheduleGroupName, region),
      fetchSchedule(supremeCourtScheduleName, scheduleGroupName, region),
      fetchSchedule(highCourtScheduleName, scheduleGroupName, region),
      fetchLowerCourtRuns(baseUrl, lowerCourtAnchor.stateCode, options.operatorToken),
      fetchSupremeCourtRuns(baseUrl, options.operatorToken),
      fetchHighCourtRuns(baseUrl, highCourtAnchor.courtSlug, options.operatorToken),
    ]);

  const liveTaskDefinitionArn = service.taskDefinition ?? null;
  const tiers: InternalFetchTierSummary[] = [
    buildTierSummary({
      checkedAt,
      schedule: lowerCourtSchedule,
      scheduleName: stateScheduleName,
      scheduleGroupName,
      scheduleExecutionLagThresholdDays,
      liveTaskDefinitionArn,
      anchor: lowerCourtAnchor,
      runs: lowerCourtRuns,
      tier: "lower_courts",
    }),
    buildTierSummary({
      checkedAt,
      schedule: supremeCourtSchedule,
      scheduleName: supremeCourtScheduleName,
      scheduleGroupName,
      scheduleExecutionLagThresholdDays,
      liveTaskDefinitionArn,
      anchor: supremeCourtAnchor,
      runs: supremeCourtRuns,
      tier: "supreme_court",
    }),
    buildTierSummary({
      checkedAt,
      schedule: highCourtSchedule,
      scheduleName: highCourtScheduleName,
      scheduleGroupName,
      scheduleExecutionLagThresholdDays,
      liveTaskDefinitionArn,
      anchor: highCourtAnchor,
      runs: highCourtRuns,
      tier: "high_courts",
    }),
  ];

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    checkedAt: checkedAt.toISOString(),
    region,
    stackName,
    scheduleGroupName,
    scheduleExecutionLagThresholdDays,
    clusterArn: service.clusterArn ?? null,
    serviceName: service.serviceName ?? null,
    liveTaskDefinitionArn,
    ok: tiers.every((tier) => tier.ok),
    failingTiers: tiers.filter((tier) => !tier.ok).map((tier) => tier.tier),
    tiers,
  };
}

export function assertInternalFetchSchedulesHealthy(summary: InternalFetchScheduleWatchdogSummary) {
  const failures = summary.tiers
    .filter((tier) => !tier.ok)
    .map((tier) => {
      const tierFailures: string[] = [];
      if (tier.scheduleState !== "ENABLED") {
        tierFailures.push("schedule is not enabled");
      }
      if (!tier.schedulerTargetMatchesService) {
        tierFailures.push(`target task definition ${tier.scheduleTaskDefinitionArn ?? "unknown"} does not match live service ${tier.liveTaskDefinitionArn ?? "unknown"}`);
      }
      if (!tier.usesScheduledFetchEntrypoint) {
        tierFailures.push(`target command is not invoking ${tier.entrypointPath}`);
      }
      if (tier.scheduleExecutionLagDetected) {
        tierFailures.push(`latest scheduled run is older than ${summary.scheduleExecutionLagThresholdDays} day(s)`);
      }
      return `${tier.tier}: ${tierFailures.join("; ")}`;
    });

  if (failures.length === 0) {
    return;
  }

  throw new Error(`Internal fetch schedule watchdog failed: ${failures.join(" | ")}`);
}

function resolveLowerCourtAnchor(): LowerCourtAnchor {
  const profile = listStateProfiles()[0];
  if (!profile) {
    throw new Error("Internal fetch schedule watchdog requires at least one implemented lower-court state profile.");
  }

  return {
    tier: "lower_courts",
    stateCode: profile.stateCode,
    stateSlug: profile.stateSlug,
    stateName: profile.stateName,
  };
}

function resolveSupremeCourtAnchor(): SupremeCourtAnchor {
  const profile = getReviewedSupremeCourtProfileForScheduledFetch();
  return {
    tier: "supreme_court",
    courtCode: profile.courtCode,
    courtSlug: profile.courtSlug,
    courtName: profile.courtName,
  };
}

function resolveHighCourtAnchor(): HighCourtAnchor {
  const profile = listReviewedHighCourtProfilesForScheduledFetch()[0];
  if (!profile) {
    throw new Error("Internal fetch schedule watchdog requires at least one reviewed High Court profile.");
  }

  return {
    tier: "high_courts",
    courtCode: profile.courtCode,
    courtSlug: profile.courtSlug,
    courtName: profile.courtName,
    coveredGeographies: profile.coveredGeographies,
  };
}

function buildTierSummary(input: {
  checkedAt: Date;
  schedule: ScheduleSummary;
  scheduleName: string;
  scheduleGroupName: string;
  scheduleExecutionLagThresholdDays: number;
  liveTaskDefinitionArn: string | null;
  anchor: TierAnchor;
  runs: ScheduledOperatorRun[];
  tier: InternalFetchScheduleTier;
}): InternalFetchTierSummary {
  const config = TIER_CONFIG[input.tier];
  const scheduledFetchCommand = extractScheduledFetchCommand(input.schedule.Target?.Input);
  const usesScheduledFetchEntrypoint = scheduledFetchCommand.includes(config.entrypointPath);
  const scheduleTaskDefinitionArn = input.schedule.Target?.EcsParameters?.TaskDefinitionArn ?? null;
  const schedulerTargetMatchesService =
    Boolean(input.liveTaskDefinitionArn) &&
    Boolean(scheduleTaskDefinitionArn) &&
    input.liveTaskDefinitionArn === scheduleTaskDefinitionArn;
  const latestScheduledRun = findLatestScheduledRun(input.runs, config.defaultNotePrefix);
  const latestScheduledRunMeasuredAt = latestScheduledRun?.completedAt ?? latestScheduledRun?.createdAt ?? null;
  const latestScheduledRunFreshnessDays = latestScheduledRunMeasuredAt
    ? freshnessDays(latestScheduledRunMeasuredAt, input.checkedAt)
    : null;
  const scheduleUpdatedAt = input.schedule.LastModificationDate ?? input.schedule.CreationDate ?? null;
  const scheduleUpdatedFreshnessDays = scheduleUpdatedAt ? freshnessDays(scheduleUpdatedAt, input.checkedAt) : null;
  const scheduleExecutionLagDetected =
    latestScheduledRunFreshnessDays !== null
      ? latestScheduledRunFreshnessDays > input.scheduleExecutionLagThresholdDays
      : scheduleUpdatedFreshnessDays !== null
        ? scheduleUpdatedFreshnessDays > input.scheduleExecutionLagThresholdDays
        : true;
  const configHealthy =
    input.schedule.State === "ENABLED" && schedulerTargetMatchesService && usesScheduledFetchEntrypoint;
  const executionHealthy = !scheduleExecutionLagDetected;

  return {
    tier: input.tier,
    scopeType: config.scopeType,
    scheduleName: input.scheduleName,
    scheduleGroupName: input.scheduleGroupName,
    scheduleArn: input.schedule.Arn ?? null,
    scheduleState: input.schedule.State ?? null,
    scheduleExpression: input.schedule.ScheduleExpression ?? null,
    scheduleExpressionTimezone: input.schedule.ScheduleExpressionTimezone ?? null,
    scheduleRoleArn: input.schedule.Target?.RoleArn ?? null,
    notePrefix: config.defaultNotePrefix,
    liveTaskDefinitionArn: input.liveTaskDefinitionArn,
    scheduleTaskDefinitionArn,
    schedulerTargetMatchesService,
    usesScheduledFetchEntrypoint,
    scheduledFetchCommand,
    entrypointPath: config.entrypointPath,
    latestScheduledRunId: latestScheduledRun?.id ?? null,
    latestScheduledRunStatus: latestScheduledRun?.status ?? null,
    latestScheduledRunNote: latestScheduledRun?.note ?? null,
    latestScheduledRunSourceSnapshotAt: latestScheduledRun?.sourceSnapshotAt ?? null,
    latestScheduledRunCreatedAt: latestScheduledRun?.createdAt ?? null,
    latestScheduledRunCompletedAt: latestScheduledRun?.completedAt ?? null,
    latestScheduledRunFreshnessDays,
    scheduleUpdatedAt,
    scheduleUpdatedFreshnessDays,
    scheduleExecutionLagDetected,
    configHealthy,
    executionHealthy,
    ok: configHealthy && executionHealthy,
    anchor: input.anchor,
  };
}

function findLatestScheduledRun(runs: ScheduledOperatorRun[], notePrefix: string) {
  return runs.find((run) => isSuccessfulScheduledRun(run, notePrefix)) ?? null;
}

function isSuccessfulScheduledRun(run: ScheduledOperatorRun, notePrefix: string) {
  return SUCCESSFUL_RUN_STATUSES.has(run.status) && typeof run.note === "string" && run.note.startsWith(notePrefix);
}

function extractScheduledFetchCommand(input: string | undefined) {
  if (!input) {
    return [];
  }

  try {
    const payload = JSON.parse(input) as {
      containerOverrides?: Array<{
        command?: unknown;
      }>;
    };

    const command = payload.containerOverrides?.[0]?.command;
    return Array.isArray(command) ? command.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

async function fetchLowerCourtRuns(baseUrl: string, stateCode: string, operatorToken: string) {
  const response = await fetchJson(`${normalizeBaseUrl(baseUrl)}/operator/runs?stateCode=${encodeURIComponent(stateCode)}`, operatorToken);
  return parseRunsPayload(response);
}

async function fetchSupremeCourtRuns(baseUrl: string, operatorToken: string) {
  const response = await fetchJson(`${normalizeBaseUrl(baseUrl)}/operator/supreme-court/runs`, operatorToken);
  return parseRunsPayload(response);
}

async function fetchHighCourtRuns(baseUrl: string, courtSlug: string, operatorToken: string) {
  const response = await fetchJson(`${normalizeBaseUrl(baseUrl)}/operator/high-courts/${encodeURIComponent(courtSlug)}/runs`, operatorToken);
  return parseRunsPayload(response);
}

async function fetchJson(url: string, operatorToken: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-operator-token": operatorToken,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Expected ${url} to return 200, received ${response.status}`);
  }

  return (await response.json()) as unknown;
}

function parseRunsPayload(value: unknown): ScheduledOperatorRun[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const runs = (value as { runs?: unknown }).runs;
  if (!Array.isArray(runs)) {
    return [];
  }

  return runs.filter(isOperatorRunRecord);
}

function isOperatorRunRecord(value: unknown): value is ScheduledOperatorRun {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ScheduledOperatorRun>;
  return (
    typeof record.id === "string" &&
    typeof record.status === "string" &&
    (typeof record.note === "string" || record.note === null || typeof record.note === "undefined") &&
    (typeof record.sourceSnapshotAt === "string" || record.sourceSnapshotAt === null || typeof record.sourceSnapshotAt === "undefined") &&
    (typeof record.createdAt === "string" || record.createdAt === null || typeof record.createdAt === "undefined") &&
    (typeof record.completedAt === "string" || record.completedAt === null || typeof record.completedAt === "undefined")
  );
}

async function fetchClusterName(stackName: string, region: string) {
  const outputs = await awsJson<{ Stacks?: Array<{ Outputs?: Array<{ OutputKey?: string; OutputValue?: string }> }> }>([
    "cloudformation",
    "describe-stacks",
    "--region",
    region,
    "--stack-name",
    stackName,
    "--output",
    "json",
  ]);

  const clusterName = outputs.Stacks?.[0]?.Outputs?.find((output) => output.OutputKey === "ClusterName")?.OutputValue;
  if (!clusterName) {
    throw new Error(`ClusterName output not found for stack ${stackName}.`);
  }

  return clusterName;
}

async function fetchServiceName(stackName: string, region: string) {
  const resources = await awsJson<{ StackResources?: Array<{ PhysicalResourceId?: string }> }>([
    "cloudformation",
    "describe-stack-resources",
    "--region",
    region,
    "--stack-name",
    stackName,
    "--logical-resource-id",
    "Service",
    "--output",
    "json",
  ]);

  const serviceName = resources.StackResources?.[0]?.PhysicalResourceId;
  if (!serviceName) {
    throw new Error(`Service resource not found for stack ${stackName}.`);
  }

  return serviceName;
}

async function fetchService(clusterName: string, serviceName: string, region: string) {
  const payload = await awsJson<{ services?: ServiceSummary[] }>([
    "ecs",
    "describe-services",
    "--region",
    region,
    "--cluster",
    clusterName,
    "--services",
    serviceName,
    "--output",
    "json",
  ]);

  const service = payload.services?.[0];
  if (!service) {
    throw new Error(`ECS service ${serviceName} not found in cluster ${clusterName}.`);
  }

  return service;
}

async function fetchSchedule(scheduleName: string, scheduleGroupName: string, region: string) {
  return awsJson<ScheduleSummary>([
    "scheduler",
    "get-schedule",
    "--region",
    region,
    "--group-name",
    scheduleGroupName,
    "--name",
    scheduleName,
    "--output",
    "json",
  ]);
}

async function awsJson<T>(args: string[]): Promise<T> {
  const { stdout } = await execFileAsync("aws", args, {
    maxBuffer: AWS_MAX_BUFFER,
  });
  return JSON.parse(stdout) as T;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function readNumberFlag(args: string[], flag: string) {
  const value = readFlag(args, flag);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }

  return parsed;
}
