import type { PublicAlphaOpsSummary } from "./public-alpha-ops.js";
import { PUBLIC_ALPHA_TARGET_SETS, type PublicAlphaTargetSet } from "./public-alpha-ops.js";
import { readFlag } from "./cli-flags.js";

export const PUBLIC_ALPHA_OPS_RESULT_PREFIX = "NYAAYWATCH_PUBLIC_ALPHA_OPS_RESULT=";
export const PUBLIC_ALPHA_OPS_ALERT_PREFIX = "NYAAYWATCH_PUBLIC_ALPHA_OPS_ALERT=";
export const DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_EXPRESSION = "cron(0/30 * * * ? *)";
export const DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_STATE = "ENABLED";

export interface PublicAlphaMonitorAlertPayload {
  baseUrl: string;
  checkedAt: string;
  error: string;
  staleTargets: string[];
  dailyFetchLagTargets: string[];
  failingTargets: string[];
  staleStates: string[];
  dailyFetchLagStates: string[];
  failingStates: string[];
}

export function resolvePublicAlphaMonitorBaseUrl(args: string[], env: NodeJS.ProcessEnv = process.env) {
  return readFlag(args, "--base-url") ?? env.PUBLIC_BASE_URL ?? env.BASE_URL;
}

export function buildPublicAlphaMonitorUsage() {
  return "Usage: node dist/src/dev/ecs-public-alpha-ops-entrypoint.js [--base-url <https://nyaaywatch.in>] [--daily-fetch-lag-days <2>] [--target-set <all|smoke>]";
}

export function readPublicAlphaMonitorLagThreshold(args: string[], flag = "--daily-fetch-lag-days") {
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

export function readPublicAlphaMonitorTargetSet(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
  flag = "--target-set",
): PublicAlphaTargetSet | undefined {
  const value = readFlag(args, flag) ?? env.PUBLIC_ALPHA_OPS_TARGET_SET;
  if (!value) {
    return undefined;
  }

  if (PUBLIC_ALPHA_TARGET_SETS.includes(value as PublicAlphaTargetSet)) {
    return value as PublicAlphaTargetSet;
  }

  throw new Error(`${flag} must be one of: ${PUBLIC_ALPHA_TARGET_SETS.join(", ")}.`);
}

export function buildPublicAlphaMonitorAlertPayload(
  baseUrl: string,
  checkedAt: Date,
  error: unknown,
  summary?: PublicAlphaOpsSummary,
): PublicAlphaMonitorAlertPayload {
  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    checkedAt: checkedAt.toISOString(),
    error: error instanceof Error ? error.message : String(error),
    staleTargets: summary?.staleTargets ?? [],
    dailyFetchLagTargets: summary?.dailyFetchLagTargets ?? [],
    failingTargets: summary?.failingTargets ?? [],
    staleStates: summary?.staleStates ?? [],
    dailyFetchLagStates: summary?.dailyFetchLagStates ?? [],
    failingStates: summary?.failingStates ?? [],
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}
