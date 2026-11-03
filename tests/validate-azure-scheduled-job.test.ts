import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateAzureScheduledJob } from "../src/dev/validate-azure-scheduled-job.js";

const NOW = Date.parse("2026-10-12T05:00:00.000Z");

function jobDocument(cronExpression: string | null = "30 2 * * *") {
  return {
    properties: {
      provisioningState: "Succeeded",
      configuration: {
        triggerType: "Schedule",
        scheduleTriggerConfig: cronExpression ? { cronExpression } : {},
      },
    },
  };
}

function execution(name: string, status: string, startTime: string, endTime: string | null = startTime) {
  return {
    name,
    properties: {
      status,
      startTime,
      endTime,
    },
  };
}

describe("Azure scheduled job watchdog", () => {
  it("accepts a recent successful execution and ignores older history", () => {
    const history = Array.from({ length: 400 }, (_, index) =>
      execution(`old-${index}`, "Failed", "2026-09-01T02:30:00.000Z", null),
    );
    history.push(execution("latest-success", "Succeeded", "2026-10-12T02:30:00.000Z", "2026-10-12T02:37:00.000Z"));

    const validation = validateAzureScheduledJob({
      jobName: "nyaaywatch-production-fetch",
      maxAgeMinutes: 1560,
      job: jobDocument(),
      executions: history,
      now: NOW,
    });

    expect(validation.failures).toEqual([]);
    expect(validation.latestScheduledRunId).toBe("latest-success");
    expect(validation.latestScheduledRunStatus).toBe("Succeeded");
    expect(validation.latestScheduledRunFreshnessMinutes).toBe(143);
  });

  it("reports a failed latest execution", () => {
    const validation = validateAzureScheduledJob({
      jobName: "nyaaywatch-production-fetch",
      maxAgeMinutes: 1560,
      job: jobDocument(),
      executions: [execution("failed-run", "Failed", "2026-10-12T02:30:00.000Z", "2026-10-12T02:31:00.000Z")],
      now: NOW,
    });

    expect(validation.failures).toContain("latest completed execution status is Failed");
  });

  it("reports an execution older than the allowed age", () => {
    const validation = validateAzureScheduledJob({
      jobName: "nyaaywatch-production-fetch",
      maxAgeMinutes: 1560,
      job: jobDocument(),
      executions: [execution("stale-run", "Succeeded", "2026-10-10T02:30:00.000Z", "2026-10-10T02:40:00.000Z")],
      now: NOW,
    });

    expect(validation.failures.some((failure) => failure.includes("minutes old"))).toBe(true);
  });

  it("does not treat a still-running execution as the completed run", () => {
    const validation = validateAzureScheduledJob({
      jobName: "nyaaywatch-production-fetch",
      maxAgeMinutes: 1560,
      job: jobDocument(),
      executions: [
        execution("done", "Succeeded", "2026-10-12T02:30:00.000Z", "2026-10-12T02:37:00.000Z"),
        execution("in-flight", "Running", "2026-10-12T04:50:00.000Z", null),
      ],
      now: NOW,
    });

    expect(validation.failures).toEqual([]);
    expect(validation.latestScheduledRunId).toBe("done");
    expect(validation.currentScheduledRunStatus).toBe("Running");
  });

  it("reads the Azure payloads from files", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "azure-job-watchdog-"));
    const jobPath = path.join(directory, "job.json");
    const executionsPath = path.join(directory, "executions.json");
    writeFileSync(jobPath, JSON.stringify(jobDocument()));
    writeFileSync(
      executionsPath,
      JSON.stringify([execution("file-run", "Succeeded", "2026-10-12T02:30:00.000Z", "2026-10-12T02:37:00.000Z")]),
    );

    try {
      const stdout = execFileSync(
        path.resolve("node_modules/.bin/tsx"),
        [
          "src/dev/validate-azure-scheduled-job.ts",
          "--job-name",
          "nyaaywatch-production-fetch",
          "--max-age-minutes",
          "1560",
          "--job-json",
          jobPath,
          "--executions-json",
          executionsPath,
          "--now",
          "2026-10-12T05:00:00.000Z",
        ],
        { encoding: "utf8" },
      );
      const validation = JSON.parse(stdout);
      expect(validation.failures).toEqual([]);
      expect(validation.latestScheduledRunId).toBe("file-run");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
