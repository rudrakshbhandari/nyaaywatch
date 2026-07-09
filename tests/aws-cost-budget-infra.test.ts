import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stackTemplate = readFileSync("infra/aws/staging/stack.yaml", "utf8");
const deployStackScript = readFileSync("infra/aws/staging/deploy-stack.sh", "utf8");
const githubDeployRolePolicy = readFileSync("infra/aws/staging/github-deploy-role-policy.json", "utf8");
const redeployServiceScript = readFileSync("infra/aws/staging/redeploy-service.sh", "utf8");
const reconcileScheduleScript = readFileSync("infra/aws/staging/reconcile-internal-fetch-schedule.sh", "utf8");

describe("AWS cost budget infra", () => {
  it("defaults the monthly budget to observed full-stack alpha spend", () => {
    expect(stackTemplate).toMatch(/MonthlyBudgetUsd:\s*\n\s*Type: Number\s*\n\s*Default: 80/);
  });

  it("defaults production ECS desired count to one task for cost-aware alpha", () => {
    expect(redeployServiceScript).toContain('desired_count="${PRODUCTION_DESIRED_COUNT:-1}"');
    expect(deployStackScript).toContain('desired_count="${PRODUCTION_DESIRED_COUNT:-1}"');
    expect(redeployServiceScript).not.toContain('desired_count="${PRODUCTION_DESIRED_COUNT:-2}"');
  });

  it("passes MonthlyBudgetUsd on every stack deploy so existing stacks pick up budget changes", () => {
    expect(deployStackScript).toContain('monthly_budget_usd="${MONTHLY_BUDGET_USD:-}"');
    expect(deployStackScript).toContain('monthly_budget_usd=80');
    expect(deployStackScript).toContain('deploy_args+=(MonthlyBudgetUsd="$monthly_budget_usd")');
  });

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
    expect(redeployServiceScript).toContain('"tags"] = [');
    expect(redeployServiceScript).toContain('"key": "project"');
    expect(redeployServiceScript).toContain("--enable-ecs-managed-tags");
    expect(redeployServiceScript).toContain("--propagate-tags TASK_DEFINITION");
    expect(githubDeployRolePolicy).toContain('"ecs:TagResource"');
    expect(githubDeployRolePolicy).toContain('"ecs:CreateAction": "RegisterTaskDefinition"');
    expect(reconcileScheduleScript).toContain('"EnableECSManagedTags": True');
    expect(reconcileScheduleScript).toContain('"PropagateTags": "TASK_DEFINITION"');
    expect(reconcileScheduleScript).toContain('"Action": ["ecs:TagResource"]');
    expect(reconcileScheduleScript).toContain('"ecs:CreateAction": "RunTask"');
  });
});
