import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/azure-production.yml", "utf8");
const terraform = readFileSync("infra/azure/production/main.tf", "utf8");

describe("Azure production bootstrap workflow", () => {
  it("preserves each existing scheduled job command until the new image is deployed", () => {
    const jobs = [
      "weekday-internal-fetch:fetch",
      "supreme-court-internal-fetch:sc-fetch",
      "high-courts-internal-fetch:hc-fetch",
      "publish-pending-sweep:publish",
      "public-alpha-ops-monitor:alpha-ops",
    ];

    expect(workflow).toContain("TF_VAR_preserved_scheduled_job_commands");
    expect(workflow).toContain("az containerapp job show");
    expect(terraform).toContain(
      "command = lookup(var.preserved_scheduled_job_commands, each.key, each.value.command)",
    );

    for (const job of jobs) {
      expect(workflow).toContain(job);
    }
  });
});
