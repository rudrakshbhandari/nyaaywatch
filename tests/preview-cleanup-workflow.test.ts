import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/preview-cleanup.yml", "utf8");
const reconcileWorkflow = readFileSync(".github/workflows/preview-reconcile.yml", "utf8");
const buildWorkflow = readFileSync(".github/workflows/azure-preview-build.yml", "utf8");
const deployWorkflow = readFileSync(".github/workflows/azure-preview-deploy.yml", "utf8");

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
  it("does not request cloud credentials on pull request close", () => {
    expect(workflow).not.toContain("id-token: write");
    expect(workflow).not.toContain("aws-actions/");
    expect(workflow).not.toContain("azure/login");
  });

  it("marks a closed PR preview comment without cloud access", () => {
    expect(stepBody("Mark preview comment closed")).not.toContain("if:");
  });

  it("builds PR images without Azure credentials or OIDC access", () => {
    expect(buildWorkflow).toContain("pull_request:");
    expect(buildWorkflow).toContain("contents: read");
    expect(buildWorkflow).not.toContain("id-token: write");
    expect(buildWorkflow).not.toContain("secrets.");
    expect(buildWorkflow).toContain("persist-credentials: false");
    expect(buildWorkflow).toContain("actions/upload-artifact@");
  });

  it("deploys only validated same-repository PR artifacts from the trusted workflow", () => {
    expect(deployWorkflow).toContain("workflow_run:");
    expect(deployWorkflow).toContain("run.data.head_repository?.full_name");
    expect(deployWorkflow).toContain("current.data.state !== \"open\"");
    expect(deployWorkflow).toContain("current.data.head.sha !== pull.head.sha");
    expect(deployWorkflow.indexOf("Download image artifact from build run")).toBeLessThan(
      deployWorkflow.indexOf("Log in to Azure using the preview-only identity"),
    );
    expect(deployWorkflow).toContain("cancel-in-progress: false");
    expect(deployWorkflow.indexOf("Revalidate pull request head before Azure access")).toBeLessThan(
      deployWorkflow.indexOf("Log in to Azure using the preview-only identity"),
    );
    expect(buildWorkflow).toContain("group: azure-preview-build-pr-");
    expect(buildWorkflow).toContain("cancel-in-progress: true");
    expect(deployWorkflow).not.toContain("actions/checkout@");
  });

  it("reconciles closed previews from a scheduled trusted workflow", () => {
    expect(reconcileWorkflow).toContain("schedule:");
    expect(reconcileWorkflow).toContain("AZURE_PREVIEW_CLIENT_ID");
    expect(reconcileWorkflow).toContain("az containerapp delete");
    expect(reconcileWorkflow).toContain("Retry deletion of registry images for closed pull requests");
    expect(reconcileWorkflow).toContain("az acr repository list");
    expect(reconcileWorkflow).toContain("az acr repository delete");
    expect(reconcileWorkflow).not.toContain("show-tags --name \"$AZURE_CONTAINER_REGISTRY\" --repository nyaaywatch --query \"[?starts_with(@, 'pr-$number-')]\" --output tsv 2>/dev/null || true");
    expect(reconcileWorkflow).not.toContain("pull_request:");
  });
});
