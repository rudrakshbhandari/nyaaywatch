import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { listStateProfiles, type NjdgStateProfile } from "../geographies.js";
import { readFlag } from "./cli-flags.js";

const execFileAsync = promisify(execFile);
const AWS_MAX_BUFFER = 10 * 1024 * 1024;

export const DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION = "ap-south-1";
export const DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK = "nyaaywatch-staging";
export const DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS = 2;
export const LEGACY_SCHEDULED_FETCH_NOTE_PREFIX = "Scheduled weekday internal raw fetch";
export const CURRENT_SCHEDULED_FETCH_NOTE_PREFIX = "Scheduled daily internal raw fetch";
export const SCHEDULED_FETCH_NOTE_PREFIXES = [CURRENT_SCHEDULED_FETCH_NOTE_PREFIX, LEGACY_SCHEDULED_FETCH_NOTE_PREFIX] as const;

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
  Target?: SchedulerTargetSummary;
}

interface ServiceSummary {
  serviceArn?: string;
  serviceName?: string;
  clusterArn?: string;
  taskDefinition?: string;
}

export interface ScheduledFetchOperatorRun {
  id: string;
  stateCode: string;
  status: string;
  note: string | null;
  sourceSnapshotAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

interface FetchScheduleAnchorRunSummary {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  latestScheduledRunId: string | null;
  latestScheduledRunStatus: string | null;
  latestScheduledRunNote: string | null;
  latestScheduledRunSourceSnapshotAt: string | null;
  latestScheduledRunCreatedAt: string | null;
  latestScheduledRunCompletedAt: string | null;
  latestScheduledRunFreshnessDays: number | null;
  scheduleExecutionLagDetected: boolean;
}

export interface FetchScheduleWatchdogSummary {
  baseUrl: string;
  checkedAt: string;
  region: string;
  stackName: string;
  scheduleName: string;
  scheduleGroupName: string;
  scheduleArn: string | null;
  scheduleState: string | null;
  scheduleExpression: string | null;
  scheduleExpressionTimezone: string | null;
  scheduleRoleArn: string | null;
  clusterArn: string | null;
  serviceName: string | null;
  liveTaskDefinitionArn: string | null;
  scheduleTaskDefinitionArn: string | null;
  schedulerTargetMatchesService: boolean;
  usesScheduledFetchEntrypoint: boolean;
  scheduledFetchCommand: string[];
  scheduleExecutionLagThresholdDays: number;
  configHealthy: boolean;
  executionHealthy: boolean;
  ok: boolean;
  anchorRun: FetchScheduleAnchorRunSummary;
}

export function parseFetchScheduleWatchdogOptions(args: string[]) {
  return {
    baseUrl: readFlag(args, "--base-url") ?? process.env.BASE_URL,
    region: readFlag(args, "--region") ?? process.env.AWS_REGION ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION,
    stackName: readFlag(args, "--stack-name") ?? process.env.STACK_NAME ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK,
    scheduleName:
      readFlag(args, "--schedule-name") ?? process.env.INTERNAL_FETCH_SCHEDULE_NAME ?? `${DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK}-weekday-internal-fetch`,
    scheduleGroupName: readFlag(args, "--schedule-group-name") ?? process.env.INTERNAL_FETCH_SCHEDULE_GROUP_NAME ?? "default",
    scheduleExecutionLagThresholdDays:
      readNumberFlag(args, "--schedule-execution-lag-days") ?? DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS,
    operatorToken: process.env.OPERATOR_API_TOKEN,
  };
}

export async function verifyFetchScheduleWatchdog(
  baseUrl: string,
  options: {
    now?: Date;
    region?: string;
    stackName?: string;
    scheduleName?: string;
    scheduleGroupName?: string;
    scheduleExecutionLagThresholdDays?: number;
    operatorToken?: string;
  } = {},
) {
  if (!options.operatorToken?.trim()) {
    throw new Error("verifyFetchScheduleWatchdog requires OPERATOR_API_TOKEN so recent scheduled operator runs can be checked.");
  }

  const anchorState = listStateProfiles()[0];
  if (!anchorState) {
    throw new Error("Fetch schedule watchdog requires at least one implemented state profile.");
  }

  const checkedAt = options.now ?? new Date();
  const region = options.region ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_REGION;
  const stackName = options.stackName ?? DEFAULT_FETCH_SCHEDULE_WATCHDOG_STACK;
  const scheduleName = options.scheduleName ?? `${stackName}-weekday-internal-fetch`;
  const scheduleGroupName = options.scheduleGroupName ?? "default";
  const scheduleExecutionLagThresholdDays =
    options.scheduleExecutionLagThresholdDays ?? DEFAULT_FETCH_SCHEDULE_EXECUTION_LAG_THRESHOLD_DAYS;

  const clusterName = await fetchClusterName(stackName, region);
  const serviceName = await fetchServiceName(stackName, region);
  const [service, schedule, anchorRuns] = await Promise.all([
    fetchService(clusterName, serviceName, region),
    fetchSchedule(scheduleName, scheduleGroupName, region),
    fetchOperatorRuns(baseUrl, anchorState, options.operatorToken),
  ]);

  return buildFetchScheduleWatchdogSummary({
    checkedAt,
    baseUrl,
    region,
    stackName,
    scheduleName,
    scheduleGroupName,
    scheduleExecutionLagThresholdDays,
    anchorState,
    service,
    schedule,
    anchorRuns,
  });
}

export function buildFetchScheduleWatchdogSummary(input: {
  checkedAt: Date;
  baseUrl: string;
  region: string;
  stackName: string;
  scheduleName: string;
  scheduleGroupName: string;
  scheduleExecutionLagThresholdDays: number;
  anchorState: NjdgStateProfile;
  service: ServiceSummary;
  schedule: ScheduleSummary;
  anchorRuns: ScheduledFetchOperatorRun[];
}): FetchScheduleWatchdogSummary {
  const scheduledFetchCommand = extractScheduledFetchCommand(input.schedule.Target?.Input);
  const usesScheduledFetchEntrypoint = scheduledFetchCommand.includes("dist/src/dev/ecs-scheduled-fetch-entrypoint.js");
  const liveTaskDefinitionArn = input.service.taskDefinition ?? null;
  const scheduleTaskDefinitionArn = input.schedule.Target?.EcsParameters?.TaskDefinitionArn ?? null;
  const schedulerTargetMatchesService =
    Boolean(liveTaskDefinitionArn) && Boolean(scheduleTaskDefinitionArn) && liveTaskDefinitionArn === scheduleTaskDefinitionArn;
  const latestScheduledRun = findLatestScheduledRun(input.anchorRuns);
  const latestScheduledRunFreshnessDays = latestScheduledRun
    ? elapsedDays(latestScheduledRun.completedAt ?? latestScheduledRun.createdAt, input.checkedAt)
    : null;
  const scheduleExecutionLagDetected =
    latestScheduledRunFreshnessDays === null || latestScheduledRunFreshnessDays > input.scheduleExecutionLagThresholdDays;
  const configHealthy =
    input.schedule.State === "ENABLED" && schedulerTargetMatchesService && usesScheduledFetchEntrypoint;
  const executionHealthy = !scheduleExecutionLagDetected;

  return {
    baseUrl: normalizeBaseUrl(input.baseUrl),
    checkedAt: input.checkedAt.toISOString(),
    region: input.region,
    stackName: input.stackName,
    scheduleName: input.scheduleName,
    scheduleGroupName: input.scheduleGroupName,
    scheduleArn: input.schedule.Arn ?? null,
    scheduleState: input.schedule.State ?? null,
    scheduleExpression: input.schedule.ScheduleExpression ?? null,
    scheduleExpressionTimezone: input.schedule.ScheduleExpressionTimezone ?? null,
    scheduleRoleArn: input.schedule.Target?.RoleArn ?? null,
    clusterArn: input.service.clusterArn ?? null,
    serviceName: input.service.serviceName ?? null,
    liveTaskDefinitionArn,
    scheduleTaskDefinitionArn,
    schedulerTargetMatchesService,
    usesScheduledFetchEntrypoint,
    scheduledFetchCommand,
    scheduleExecutionLagThresholdDays: input.scheduleExecutionLagThresholdDays,
    configHealthy,
    executionHealthy,
    ok: configHealthy && executionHealthy,
    anchorRun: {
      stateCode: input.anchorState.stateCode,
      stateName: input.anchorState.stateName,
      stateSlug: input.anchorState.stateSlug,
      latestScheduledRunId: latestScheduledRun?.id ?? null,
      latestScheduledRunStatus: latestScheduledRun?.status ?? null,
      latestScheduledRunNote: latestScheduledRun?.note ?? null,
      latestScheduledRunSourceSnapshotAt: latestScheduledRun?.sourceSnapshotAt ?? null,
      latestScheduledRunCreatedAt: latestScheduledRun?.createdAt ?? null,
      latestScheduledRunCompletedAt: latestScheduledRun?.completedAt ?? null,
      latestScheduledRunFreshnessDays,
      scheduleExecutionLagDetected,
    },
  };
}

export function assertFetchScheduleWatchdogHealthy(summary: FetchScheduleWatchdogSummary) {
  const failures: string[] = [];

  if (summary.scheduleState !== "ENABLED") {
    failures.push(`schedule ${summary.scheduleName} is not enabled`);
  }

  if (!summary.schedulerTargetMatchesService) {
    failures.push(`schedule target ${summary.scheduleTaskDefinitionArn ?? "unknown"} does not match live task definition ${summary.liveTaskDefinitionArn ?? "unknown"}`);
  }

  if (!summary.usesScheduledFetchEntrypoint) {
    failures.push(`schedule ${summary.scheduleName} is not invoking ecs-scheduled-fetch-entrypoint.js`);
  }

  if (summary.anchorRun.scheduleExecutionLagDetected) {
    failures.push(
      `latest scheduled ${summary.anchorRun.stateCode} run is older than ${summary.scheduleExecutionLagThresholdDays} day(s)`,
    );
  }

  if (failures.length === 0) {
    return;
  }

  throw new Error(`Internal fetch schedule watchdog failed: ${failures.join("; ")}`);
}

export function isScheduledFetchNote(note: string | null | undefined) {
  if (!note) {
    return false;
  }

  return SCHEDULED_FETCH_NOTE_PREFIXES.some((prefix) => note.startsWith(prefix));
}

function findLatestScheduledRun(runs: ScheduledFetchOperatorRun[]) {
  return [...runs]
    .filter((run) => isScheduledFetchNote(run.note))
    .sort((left, right) => {
      const rightTime = latestRelevantTimestamp(right).getTime();
      const leftTime = latestRelevantTimestamp(left).getTime();
      return rightTime - leftTime;
    })[0];
}

function latestRelevantTimestamp(run: ScheduledFetchOperatorRun) {
  return new Date(run.completedAt ?? run.createdAt ?? 0);
}

function extractScheduledFetchCommand(rawInput?: string) {
  if (!rawInput) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawInput) as {
      containerOverrides?: Array<{
        command?: unknown;
      }>;
    };
    const command = parsed.containerOverrides?.[0]?.command;
    return Array.isArray(command) ? command.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function elapsedDays(value: string | null | undefined, now: Date) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24)));
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

async function fetchClusterName(stackName: string, region: string) {
  const value = await awsText(
    [
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      stackName,
      "--region",
      region,
      "--query",
      "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue | [0]",
      "--output",
      "text",
    ],
  );

  if (!value || value === "None") {
    throw new Error(`Stack ${stackName} is missing the ClusterName output.`);
  }

  return value;
}

async function fetchServiceName(stackName: string, region: string) {
  const response = await awsJson<{ StackResourceDetail?: { PhysicalResourceId?: string } }>([
    "cloudformation",
    "describe-stack-resource",
    "--stack-name",
    stackName,
    "--logical-resource-id",
    "Service",
    "--region",
    region,
    "--output",
    "json",
  ]);
  const serviceName = response.StackResourceDetail?.PhysicalResourceId;
  if (!serviceName) {
    throw new Error(`Stack ${stackName} does not expose an ECS Service resource.`);
  }

  return serviceName;
}

async function fetchService(clusterName: string, serviceName: string, region: string) {
  const response = await awsJson<{ services?: ServiceSummary[]; failures?: Array<{ reason?: string }> }>([
    "ecs",
    "describe-services",
    "--cluster",
    clusterName,
    "--services",
    serviceName,
    "--region",
    region,
    "--output",
    "json",
  ]);
  const service = response.services?.[0];
  if (!service) {
    const failureReason = response.failures?.[0]?.reason;
    throw new Error(`Unable to describe ECS service ${serviceName}.${failureReason ? ` ${failureReason}` : ""}`);
  }

  return service;
}

async function fetchSchedule(scheduleName: string, scheduleGroupName: string, region: string) {
  return awsJson<ScheduleSummary>([
    "scheduler",
    "get-schedule",
    "--group-name",
    scheduleGroupName,
    "--name",
    scheduleName,
    "--region",
    region,
    "--output",
    "json",
  ]);
}

async function fetchOperatorRuns(baseUrl: string, anchorState: NjdgStateProfile, operatorToken: string) {
  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/operator/runs?stateCode=${encodeURIComponent(anchorState.stateCode)}`,
    {
      headers: {
        accept: "application/json",
        "x-operator-token": operatorToken,
      },
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Expected ${normalizeBaseUrl(baseUrl)}/operator/runs?stateCode=${anchorState.stateCode} to return 200, received ${response.status}`,
    );
  }

  const payload = (await response.json()) as { runs?: unknown };
  const runs = Array.isArray(payload.runs) ? payload.runs : [];
  return runs.filter(isScheduledFetchOperatorRun);
}

function isScheduledFetchOperatorRun(value: unknown): value is ScheduledFetchOperatorRun {
  if (!value || typeof value !== "object") {
    return false;
  }

  const run = value as Partial<ScheduledFetchOperatorRun>;
  return (
    typeof run.id === "string" &&
    typeof run.stateCode === "string" &&
    typeof run.status === "string" &&
    (typeof run.note === "string" || run.note === null || run.note === undefined) &&
    (typeof run.sourceSnapshotAt === "string" || run.sourceSnapshotAt === null || run.sourceSnapshotAt === undefined) &&
    (typeof run.createdAt === "string" || run.createdAt === null || run.createdAt === undefined) &&
    (typeof run.completedAt === "string" || run.completedAt === null || run.completedAt === undefined)
  );
}

async function awsJson<T>(awsArgs: string[]) {
  const { stdout } = await execFileAsync("aws", awsArgs, { maxBuffer: AWS_MAX_BUFFER });
  return JSON.parse(stdout) as T;
}

async function awsText(awsArgs: string[]) {
  const { stdout } = await execFileAsync("aws", awsArgs, { maxBuffer: AWS_MAX_BUFFER });
  return stdout.trim();
}
