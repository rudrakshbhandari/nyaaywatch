import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/preview-cleanup.yml", "utf8");

function stepBody(name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = workflow.match(
    new RegExp(`- name: ${escapedName}\\n([\\s\\S]*?)(?=\\n      - name:|\\n?$)`),
  );

  if (!match) {
    throw new Error(`Could not find workflow step: ${name}`);
  }

  return match[1];
}

describe("preview cleanup workflow", () => {
  it("only assumes AWS credentials and deletes services when AWS previews are enabled", () => {
    const enabledCondition = "if: vars.ENABLE_AWS_PREVIEWS == 'true'";

    expect(stepBody("Configure AWS credentials")).toContain(enabledCondition);
    expect(stepBody("Delete preview service")).toContain(enabledCondition);
  });

  it("still marks a closed PR preview comment when AWS previews are disabled", () => {
    expect(stepBody("Mark preview comment closed")).not.toContain("if:");
  });
});
