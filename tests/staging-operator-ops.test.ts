import { describe, expect, it } from "vitest";

import {
  ECS_OPERATOR_ERROR_PREFIX,
  ECS_OPERATOR_RESULT_PREFIX,
  buildStagingOperatorCommand,
  buildTaskLogStreamName,
  extractStagingOperatorResult,
  parseStagingOperatorCliOptions,
} from "../src/dev/staging-operator-ops.js";

describe("staging operator helpers", () => {
  it("parses staging CLI flags and forwards the operator invocation", () => {
    const parsed = parseStagingOperatorCliOptions([
      "--stack",
      "custom-stack",
      "--profile",
      "sandbox",
      "--state",
      "UP",
      "fetch",
      "Internal Uttar Pradesh fetch",
    ]);

    expect(parsed.stackName).toBe("custom-stack");
    expect(parsed.region).toBe("ap-south-1");
    expect(parsed.profile).toBe("sandbox");
    expect(parsed.invocation).toEqual({
      stateCode: "UP",
      command: "fetch",
      note: "Internal Uttar Pradesh fetch",
    });
  });

  it("builds the ECS container command for a targeted publish", () => {
    expect(
      buildStagingOperatorCommand({
        stateCode: "UP",
        command: "publish",
        targetId: "run_up_123",
        note: "Publish Uttar Pradesh proof cycle",
      }),
    ).toEqual([
      "node",
      "dist/src/dev/ecs-operator-entrypoint.js",
      "--state",
      "UP",
      "publish",
      "run_up_123",
      "Publish Uttar Pradesh proof cycle",
    ]);
  });

  it("derives the CloudWatch log stream name from the task ARN", () => {
    expect(
      buildTaskLogStreamName(
        "arn:aws:ecs:ap-south-1:123456789012:task/nyaaywatch-staging/0f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
        "nyaaywatch-staging",
      ),
    ).toBe("ecs/nyaaywatch-staging/0f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c");
  });

  it("extracts the ECS operator result payload from log lines", () => {
    const result = extractStagingOperatorResult([
      "{\"ts\":\"2026-04-17T00:00:00.000Z\",\"level\":\"info\",\"event\":\"server_started\"}",
      `${ECS_OPERATOR_RESULT_PREFIX}{"run":{"id":"run_up_123","stateCode":"UP"}}`,
    ]);

    expect(result).toEqual({
      run: {
        id: "run_up_123",
        stateCode: "UP",
      },
    });
  });

  it("surfaces the ECS operator error line when no result is present", () => {
    expect(() =>
      extractStagingOperatorResult([
        `${ECS_OPERATOR_ERROR_PREFIX}Run run_missing is not ready for publish review.`,
      ]),
    ).toThrow("Run run_missing is not ready for publish review.");
  });
});
