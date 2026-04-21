import { afterEach, describe, expect, it, vi } from "vitest";

const execFile = vi.fn();
const listStateProfiles = vi.fn();
const listReviewedHighCourtProfilesForScheduledFetch = vi.fn();
const getReviewedSupremeCourtProfileForScheduledFetch = vi.fn();
const fetchMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile,
}));

vi.mock("../src/geographies.js", () => ({
  listStateProfiles,
}));

vi.mock("../src/dev/scheduled-fetch-targets.js", () => ({
  listReviewedHighCourtProfilesForScheduledFetch,
  getReviewedSupremeCourtProfileForScheduledFetch,
}));

describe("internal fetch schedule watchdog", () => {
  global.fetch = fetchMock as typeof fetch;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps all three schedules green when task definitions, commands, and recent runs align", async () => {
    listStateProfiles.mockReturnValueOnce([{ stateCode: "HP", stateSlug: "himachal-pradesh", stateName: "Himachal Pradesh" }]);
    getReviewedSupremeCourtProfileForScheduledFetch.mockReturnValueOnce({
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
    });
    listReviewedHighCourtProfilesForScheduledFetch.mockReturnValueOnce([
      {
        courtCode: "HPHC",
        courtSlug: "himachal",
        courtName: "High Court of Himachal Pradesh",
        coveredGeographies: [{ geographyCode: "HP", geographyName: "Himachal Pradesh", geographyType: "state", lowerCourtStateCode: "HP" }],
      },
    ]);

    mockAwsSequence({
      clusterName: "nyaaywatch-staging",
      serviceName: "nyaaywatch-staging-Service-zXxqGRuc7amS",
      liveTaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:141",
    });

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_lower_1",
              status: "completed",
              note: "Scheduled daily lower-court internal raw fetch (<aws.scheduler.scheduled-time>) for Himachal Pradesh [HP]",
              sourceSnapshotAt: "2026-04-20T00:00:00.000Z",
              createdAt: "2026-04-20T02:30:00.000Z",
              completedAt: "2026-04-20T02:35:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_sci_1",
              status: "completed",
              note: "Scheduled daily Supreme Court internal raw fetch (<aws.scheduler.scheduled-time>) for Supreme Court of India",
              sourceSnapshotAt: "2026-04-20T00:00:00.000Z",
              createdAt: "2026-04-20T02:40:00.000Z",
              completedAt: "2026-04-20T02:45:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_hc_1",
              status: "completed",
              note: "Scheduled daily High Court internal raw fetch (<aws.scheduler.scheduled-time>) for High Court of Himachal Pradesh [himachal]",
              sourceSnapshotAt: "2026-04-20T00:00:00.000Z",
              createdAt: "2026-04-20T02:50:00.000Z",
              completedAt: "2026-04-20T02:55:00.000Z",
            },
          ],
        }),
      );

    const { assertInternalFetchSchedulesHealthy, verifyInternalFetchSchedules } = await import(
      "../src/dev/internal-fetch-schedule-watchdog.js"
    );
    const summary = await verifyInternalFetchSchedules("https://nyaaywatch.in", {
      now: new Date("2026-04-20T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.ok).toBe(true);
    expect(summary.failingTiers).toEqual([]);
    expect(summary.tiers.map((tier) => tier.tier)).toEqual(["lower_courts", "supreme_court", "high_courts"]);
    expect(summary.tiers.every((tier) => tier.schedulerTargetMatchesService)).toBe(true);
    expect(summary.tiers.every((tier) => tier.usesScheduledFetchEntrypoint)).toBe(true);
    expect(summary.tiers.every((tier) => tier.scheduleExecutionLagDetected === false)).toBe(true);
    expect(() => assertInternalFetchSchedulesHealthy(summary)).not.toThrow();
  });

  it("fails when a tier is pointed at the wrong task definition or its latest scheduled run is stale", async () => {
    listStateProfiles.mockReturnValueOnce([{ stateCode: "HP", stateSlug: "himachal-pradesh", stateName: "Himachal Pradesh" }]);
    getReviewedSupremeCourtProfileForScheduledFetch.mockReturnValueOnce({
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
    });
    listReviewedHighCourtProfilesForScheduledFetch.mockReturnValueOnce([
      {
        courtCode: "HPHC",
        courtSlug: "himachal",
        courtName: "High Court of Himachal Pradesh",
        coveredGeographies: [{ geographyCode: "HP", geographyName: "Himachal Pradesh", geographyType: "state", lowerCourtStateCode: "HP" }],
      },
    ]);

    mockAwsSequence({
      clusterName: "nyaaywatch-staging",
      serviceName: "nyaaywatch-staging-Service-zXxqGRuc7amS",
      liveTaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:141",
      supremeCourtTaskDefinitionArn: "arn:aws:ecs:ap-south-1:723951822728:task-definition/nyaaywatch-staging:140",
      scheduleLastModificationDate: "2026-04-15T00:00:00.000Z",
    });

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_lower_1",
              status: "completed",
              note: "Scheduled daily lower-court internal raw fetch (<aws.scheduler.scheduled-time>) for Himachal Pradesh [HP]",
              sourceSnapshotAt: "2026-04-20T00:00:00.000Z",
              createdAt: "2026-04-20T02:30:00.000Z",
              completedAt: "2026-04-20T02:35:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_sci_old",
              status: "completed",
              note: "Scheduled daily Supreme Court internal raw fetch (<aws.scheduler.scheduled-time>) for Supreme Court of India",
              sourceSnapshotAt: "2026-04-15T00:00:00.000Z",
              createdAt: "2026-04-15T02:40:00.000Z",
              completedAt: "2026-04-15T02:45:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          runs: [
            {
              id: "run_hc_1",
              status: "completed",
              note: "Scheduled daily High Court internal raw fetch (<aws.scheduler.scheduled-time>) for High Court of Himachal Pradesh [himachal]",
              sourceSnapshotAt: "2026-04-20T00:00:00.000Z",
              createdAt: "2026-04-20T02:50:00.000Z",
              completedAt: "2026-04-20T02:55:00.000Z",
            },
          ],
        }),
      );

    const { assertInternalFetchSchedulesHealthy, verifyInternalFetchSchedules } = await import(
      "../src/dev/internal-fetch-schedule-watchdog.js"
    );
    const summary = await verifyInternalFetchSchedules("https://nyaaywatch.in", {
      now: new Date("2026-04-20T12:00:00.000Z"),
      operatorToken: "operator-test-token",
    });

    expect(summary.ok).toBe(false);
    expect(summary.failingTiers).toEqual(["supreme_court"]);
    expect(summary.tiers.find((tier) => tier.tier === "supreme_court")).toMatchObject({
      schedulerTargetMatchesService: false,
      scheduleExecutionLagDetected: true,
      ok: false,
    });
    expect(() => assertInternalFetchSchedulesHealthy(summary)).toThrow(
      "Internal fetch schedule watchdog failed: supreme_court:",
    );
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function mockAwsSequence(input: {
  clusterName: string;
  serviceName: string;
  liveTaskDefinitionArn: string;
  supremeCourtTaskDefinitionArn?: string;
  scheduleLastModificationDate?: string;
}) {
  const liveTaskDefinitionArn = input.liveTaskDefinitionArn;
  const supremeCourtTaskDefinitionArn = input.supremeCourtTaskDefinitionArn ?? liveTaskDefinitionArn;
  const scheduleLastModificationDate = input.scheduleLastModificationDate ?? "2026-04-20T00:00:00.000Z";

  execFile.mockImplementationOnce((_file: string, args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify({
        Stacks: [
          {
            Outputs: [{ OutputKey: "ClusterName", OutputValue: input.clusterName }],
          },
        ],
      }),
      stderr: "",
    });
  });

  execFile.mockImplementationOnce((_file: string, _args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify({
        StackResources: [{ PhysicalResourceId: input.serviceName }],
      }),
      stderr: "",
    });
  });

  execFile.mockImplementationOnce((_file: string, _args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify({
        services: [
          {
            serviceName: input.serviceName,
            clusterArn: `arn:aws:ecs:ap-south-1:723951822728:cluster/${input.clusterName}`,
            taskDefinition: liveTaskDefinitionArn,
          },
        ],
      }),
      stderr: "",
    });
  });

  execFile.mockImplementationOnce((_file: string, _args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify(
        scheduleJson(
          "nyaaywatch-staging-weekday-internal-fetch",
          liveTaskDefinitionArn,
          "dist/src/dev/ecs-scheduled-fetch-entrypoint.js",
          "Scheduled daily lower-court internal raw fetch",
          scheduleLastModificationDate,
        ),
      ),
      stderr: "",
    });
  });

  execFile.mockImplementationOnce((_file: string, _args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify(
        scheduleJson(
          "nyaaywatch-staging-supreme-court-internal-fetch",
          supremeCourtTaskDefinitionArn,
          "dist/src/dev/ecs-scheduled-supreme-court-fetch-entrypoint.js",
          "Scheduled daily Supreme Court internal raw fetch",
          scheduleLastModificationDate,
        ),
      ),
      stderr: "",
    });
  });

  execFile.mockImplementationOnce((_file: string, _args: string[], options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    callback(null, {
      stdout: JSON.stringify(
        scheduleJson(
          "nyaaywatch-staging-high-courts-internal-fetch",
          liveTaskDefinitionArn,
          "dist/src/dev/ecs-scheduled-high-court-fetch-entrypoint.js",
          "Scheduled daily High Court internal raw fetch",
          scheduleLastModificationDate,
        ),
      ),
      stderr: "",
    });
  });
}

function scheduleJson(name: string, taskDefinitionArn: string, entrypointPath: string, notePrefix: string, lastModificationDate: string) {
  return {
    Arn: `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/${name}`,
    Name: name,
    GroupName: "default",
    State: "ENABLED",
    ScheduleExpression: "cron(0 8 * * ? *)",
    ScheduleExpressionTimezone: "Asia/Kolkata",
    CreationDate: lastModificationDate,
    LastModificationDate: lastModificationDate,
    Target: {
      RoleArn: "arn:aws:iam::723951822728:role/nyaaywatch-staging-internal-fetch-scheduler",
      EcsParameters: {
        TaskDefinitionArn: taskDefinitionArn,
      },
      Input: JSON.stringify({
        containerOverrides: [
          {
            name: "nyaaywatch-staging",
            command: ["node", entrypointPath, `${notePrefix} (<aws.scheduler.scheduled-time>)`],
          },
        ],
      }),
    },
  };
}
