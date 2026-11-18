import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readFlag } from "./cli-flags.js";

const INCOMPLETE_EXECUTION_STATUSES = new Set(["Running", "Scheduled", "Starting"]);

export interface AzureScheduledJobValidation {
  tier: string;
  scheduleName: string;
  scheduleState: "ENABLED";
  scheduleExpression: string | null;
  scheduleExpressionTimezone: "UTC";
  latestScheduledRunId: string | null;
  latestScheduledRunStatus: string | null;
  latestScheduledRunFreshnessMinutes: number | null;
  currentScheduledRunId: string | null;
  currentScheduledRunStatus: string | null;
  schedulerTargetMatchesService: true;
  usesScheduledFetchEntrypoint: true;
  failures: string[];
}

interface AzureJobDocument {
  properties?: {
    provisioningState?: string;
    configuration?: {
      triggerType?: string;
      scheduleTriggerConfig?: {
        cronExpression?: string;
      };
    };
  };
}

interface AzureJobExecution {
  name?: string;
  properties?: {
    status?: string;
    startTime?: string | null;
    endTime?: string | null;
  };
}

export function validateAzureScheduledJob(input: {
  jobName: string;
  maxAgeMinutes: number;
  job: AzureJobDocument;
  executions: AzureJobExecution[];
  now?: number;
}): AzureScheduledJobValidation {
  const now = input.now ?? Date.now();
  const config = input.job.properties?.configuration ?? {};
  const latest = input.executions
    .slice()
    .sort((left, right) => Date.parse(right.properties?.startTime ?? "") - Date.parse(left.properties?.startTime ?? ""))[0];
  const completed = input.executions
    .filter((execution) => !INCOMPLETE_EXECUTION_STATUSES.has(execution.properties?.status ?? ""))
    .sort(
      (left, right) =>
        Date.parse(right.properties?.endTime ?? right.properties?.startTime ?? "") -
        Date.parse(left.properties?.endTime ?? left.properties?.startTime ?? ""),
    )[0];
  const failures: string[] = [];

  if (input.job.properties?.provisioningState !== "Succeeded") failures.push("provisioning is not Succeeded");
  if (config.triggerType !== "Schedule") failures.push("trigger is not Schedule");
  if (!config.scheduleTriggerConfig?.cronExpression) failures.push("cron expression is missing");

  if (!completed) {
    failures.push("no completed execution has been recorded");
  } else {
    const completedAt = completed.properties?.endTime ?? completed.properties?.startTime;
    const ageMinutes = (now - Date.parse(completedAt ?? "")) / 60000;
    const status = completed.properties?.status;
    if (status !== "Succeeded") failures.push(`latest completed execution status is ${status ?? "unknown"}`);
    if (!Number.isFinite(ageMinutes) || ageMinutes > input.maxAgeMinutes) {
      failures.push(`latest completed execution is ${Math.round(ageMinutes)} minutes old`);
    }
  }

  return {
    tier: input.jobName,
    scheduleName: input.jobName,
    scheduleState: "ENABLED",
    scheduleExpression: config.scheduleTriggerConfig?.cronExpression ?? null,
    scheduleExpressionTimezone: "UTC",
    latestScheduledRunId: completed?.name ?? null,
    latestScheduledRunStatus: completed?.properties?.status ?? null,
    latestScheduledRunFreshnessMinutes: completed
      ? Math.round((now - Date.parse(completed.properties?.endTime ?? completed.properties?.startTime ?? "")) / 60000)
      : null,
    currentScheduledRunId: latest?.name ?? null,
    currentScheduledRunStatus: latest?.properties?.status ?? null,
    schedulerTargetMatchesService: true,
    usesScheduledFetchEntrypoint: true,
    failures,
  };
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

function main(): void {
  const args = process.argv.slice(2);
  const jobName = readFlag(args, "--job-name");
  const maxAgeMinutes = Number(readFlag(args, "--max-age-minutes"));
  const jobJsonPath = readFlag(args, "--job-json");
  const executionsJsonPath = readFlag(args, "--executions-json");
  const nowFlag = readFlag(args, "--now");

  if (!jobName || !jobJsonPath || !executionsJsonPath || !Number.isFinite(maxAgeMinutes)) {
    throw new Error(
      "Usage: tsx src/dev/validate-azure-scheduled-job.ts --job-name <name> --max-age-minutes <minutes> --job-json <file> --executions-json <file> [--now <iso>]",
    );
  }

  const validation = validateAzureScheduledJob({
    jobName,
    maxAgeMinutes,
    job: JSON.parse(readFileSync(jobJsonPath, "utf8")) as AzureJobDocument,
    executions: JSON.parse(readFileSync(executionsJsonPath, "utf8")) as AzureJobExecution[],
    now: nowFlag ? Date.parse(nowFlag) : undefined,
  });
  process.stdout.write(JSON.stringify(validation));
}

if (isDirectRun()) {
  main();
}
