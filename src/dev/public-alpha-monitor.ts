import type { PublicAlphaOpsSummary } from "./public-alpha-ops.js";

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
  return "Usage: node dist/src/dev/ecs-public-alpha-ops-entrypoint.js [--base-url <https://nyaaywatch.in>] [--daily-fetch-lag-days <2>]";
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

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}
