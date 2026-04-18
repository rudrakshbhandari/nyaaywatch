import { describe, expect, it } from "vitest";

import {
  assertFetchScheduleWatchdogHealthy,
  buildFetchScheduleWatchdogSummary,
  CURRENT_SCHEDULED_FETCH_NOTE_PREFIX,
  LEGACY_SCHEDULED_FETCH_NOTE_PREFIX,
  isScheduledFetchNote,
} from "../src/dev/internal-fetch-schedule-watchdog.js";

const anchorState = {
  stateCode: "HP",
  stateName: "Himachal Pradesh",
  stateSlug: "himachal-pradesh",
  njdgStateValue: "2~5",
  publicAlpha: true,
} as const;

describe("internal fetch schedule watchdog", () => {
  it("treats a matched schedule target and recent scheduled anchor run as healthy", () => {
    const summary = buildFetchScheduleWatchdogSummary({
      checkedAt: new Date("2026-04-18T12:00:00.000Z"),
      baseUrl: "https://nyaaywatch.in",
      region: "ap-south-1",
      stackName: "nyaaywatch-staging",
      scheduleName: "nyaaywatch-staging-weekday-internal-fetch",
      scheduleGroupName: "default",
      scheduleExecutionLagThresholdDays: 2,
      anchorState,
      service: {
        serviceName: "nyaaywatch-staging-Service-zXxqGRuc7amS",
        clusterArn: "arn:aws:ecs:ap-south-1:723951822728:cluster/nyaaywatch-staging",
        taskDefinition: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
      },
      schedule: {
        Arn: "arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-staging-weekday-internal-fetch",
        State: "ENABLED",
        ScheduleExpression: "cron(0 8 * * ? *)",
        ScheduleExpressionTimezone: "Asia/Kolkata",
        Target: {
          RoleArn: "arn:aws:iam::723951822728:role/nyaaywatch-staging-internal-fetch-scheduler",
          Input:
            '{"containerOverrides":[{"name":"nyaaywatch-staging","command":["node","dist/src/dev/ecs-scheduled-fetch-entrypoint.js","Scheduled daily internal raw fetch (<aws.scheduler.scheduled-time>)"]}]}',
          EcsParameters: {
            TaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
          },
        },
      },
      anchorRuns: [
        {
          id: "run_hp_scheduled",
          stateCode: "HP",
          status: "completed",
          note: "Scheduled daily internal raw fetch (2026-04-18T02:30:00Z) for Himachal Pradesh [HP]",
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          createdAt: "2026-04-18T02:30:02.000Z",
          completedAt: "2026-04-18T02:30:44.000Z",
        },
      ],
    });

    expect(summary.ok).toBe(true);
    expect(summary.configHealthy).toBe(true);
    expect(summary.executionHealthy).toBe(true);
    expect(summary.anchorRun.latestScheduledRunId).toBe("run_hp_scheduled");
    expect(summary.anchorRun.latestScheduledRunFreshnessDays).toBe(0);
    expect(() => assertFetchScheduleWatchdogHealthy(summary)).not.toThrow();
  });

  it("fails when the schedule target drifts behind the live ECS service", () => {
    const summary = buildFetchScheduleWatchdogSummary({
      checkedAt: new Date("2026-04-18T12:00:00.000Z"),
      baseUrl: "https://nyaaywatch.in",
      region: "ap-south-1",
      stackName: "nyaaywatch-staging",
      scheduleName: "nyaaywatch-staging-weekday-internal-fetch",
      scheduleGroupName: "default",
      scheduleExecutionLagThresholdDays: 2,
      anchorState,
      service: {
        serviceName: "nyaaywatch-staging-Service-zXxqGRuc7amS",
        clusterArn: "arn:aws:ecs:ap-south-1:723951822728:cluster/nyaaywatch-staging",
        taskDefinition: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
      },
      schedule: {
        State: "ENABLED",
        Target: {
          Input:
            '{"containerOverrides":[{"name":"nyaaywatch-staging","command":["node","dist/src/dev/ecs-scheduled-fetch-entrypoint.js","Scheduled daily internal raw fetch (<aws.scheduler.scheduled-time>)"]}]}',
          EcsParameters: {
            TaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:76",
          },
        },
      },
      anchorRuns: [
        {
          id: "run_hp_scheduled",
          stateCode: "HP",
          status: "completed",
          note: `${CURRENT_SCHEDULED_FETCH_NOTE_PREFIX} (2026-04-18T02:30:00Z)`,
          sourceSnapshotAt: "2026-04-18T00:00:00.000Z",
          createdAt: "2026-04-18T02:30:02.000Z",
          completedAt: "2026-04-18T02:30:44.000Z",
        },
      ],
    });

    expect(summary.schedulerTargetMatchesService).toBe(false);
    expect(() => assertFetchScheduleWatchdogHealthy(summary)).toThrow(
      "Internal fetch schedule watchdog failed: schedule target arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:76 does not match live task definition arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
    );
  });

  it("fails when no recent scheduled anchor-state run exists", () => {
    const summary = buildFetchScheduleWatchdogSummary({
      checkedAt: new Date("2026-04-18T12:00:00.000Z"),
      baseUrl: "https://nyaaywatch.in",
      region: "ap-south-1",
      stackName: "nyaaywatch-staging",
      scheduleName: "nyaaywatch-staging-weekday-internal-fetch",
      scheduleGroupName: "default",
      scheduleExecutionLagThresholdDays: 2,
      anchorState,
      service: {
        serviceName: "nyaaywatch-staging-Service-zXxqGRuc7amS",
        clusterArn: "arn:aws:ecs:ap-south-1:723951822728:cluster/nyaaywatch-staging",
        taskDefinition: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
      },
      schedule: {
        State: "ENABLED",
        Target: {
          Input:
            '{"containerOverrides":[{"name":"nyaaywatch-staging","command":["node","dist/src/dev/ecs-scheduled-fetch-entrypoint.js","Scheduled daily internal raw fetch (<aws.scheduler.scheduled-time>)"]}]}',
          EcsParameters: {
            TaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:77",
          },
        },
      },
      anchorRuns: [
        {
          id: "run_hp_old_scheduled",
          stateCode: "HP",
          status: "completed",
          note: `${LEGACY_SCHEDULED_FETCH_NOTE_PREFIX} (2026-04-15T02:30:00Z)`,
          sourceSnapshotAt: "2026-04-15T00:00:00.000Z",
          createdAt: "2026-04-15T02:30:02.000Z",
          completedAt: "2026-04-15T02:30:44.000Z",
        },
      ],
    });

    expect(summary.executionHealthy).toBe(false);
    expect(summary.anchorRun.scheduleExecutionLagDetected).toBe(true);
    expect(() => assertFetchScheduleWatchdogHealthy(summary)).toThrow(
      "Internal fetch schedule watchdog failed: latest scheduled HP run is older than 2 day(s)",
    );
  });

  it("recognizes both legacy and current scheduled note prefixes", () => {
    expect(isScheduledFetchNote(`${CURRENT_SCHEDULED_FETCH_NOTE_PREFIX} (2026-04-18T02:30:00Z)`)).toBe(true);
    expect(isScheduledFetchNote(`${LEGACY_SCHEDULED_FETCH_NOTE_PREFIX} (2026-04-17T20:09:08Z)`)).toBe(true);
    expect(isScheduledFetchNote("Manual operator fetch")).toBe(false);
  });
});
