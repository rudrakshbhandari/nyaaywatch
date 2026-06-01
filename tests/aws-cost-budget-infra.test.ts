import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stackTemplate = readFileSync("infra/aws/staging/stack.yaml", "utf8");
const deployStackScript = readFileSync("infra/aws/staging/deploy-stack.sh", "utf8");
const reconcileScheduleScript = readFileSync("infra/aws/staging/reconcile-internal-fetch-schedule.sh", "utf8");

describe("AWS cost budget infra", () => {
  it("scopes the monthly budget to project and environment cost tags", () => {
    expect(stackTemplate).toContain("FilterExpression:");
    expect(stackTemplate).toContain("Key: project");
    expect(stackTemplate).toContain("Key: env");
    expect(stackTemplate).toContain("ResourceTags:");
  });

  it("passes project and environment stack tags during CloudFormation deploy", () => {
    expect(deployStackScript).toContain("--tags");
    expect(deployStackScript).toContain('project="$project_name"');
    expect(deployStackScript).toContain('env="$environment_name"');
  });

  it("propagates NyaayWatch tags to ECS service tasks and scheduled tasks", () => {
    expect(stackTemplate).toContain("EnableECSManagedTags: true");
    expect(stackTemplate).toContain("PropagateTags: TASK_DEFINITION");
    expect(reconcileScheduleScript).toContain('"EnableECSManagedTags": True');
    expect(reconcileScheduleScript).toContain('"PropagateTags": "TASK_DEFINITION"');
    expect(reconcileScheduleScript).toContain('"Action": ["ecs:TagResource"]');
    expect(reconcileScheduleScript).toContain('"ecs:CreateAction": "RunTask"');
  });
});
