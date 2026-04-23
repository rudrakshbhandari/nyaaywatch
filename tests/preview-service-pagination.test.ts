import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("preview App Runner pagination helpers", () => {
  it("reconciles stale preview services across every App Runner list-services page", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "preview-reconcile-"));
    tempDirs.push(tempDir);

    const binDir = path.join(tempDir, "bin");
    const deletedLog = path.join(tempDir, "deleted-services.log");
    const allowlistPath = path.join(tempDir, "open-preview-services.txt");
    const deleteScriptPath = path.join(tempDir, "delete-service.sh");
    const awsPath = path.join(binDir, "aws");

    mkdirSync(binDir, { recursive: true });
    writeFileSync(allowlistPath, "nyaaywatch-pr-173\nnyaaywatch-pr-89\n");
    writeFileSync(
      deleteScriptPath,
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$1" >> "${deletedLog}"
`,
    );
    writeFileSync(
      awsPath,
      `#!/usr/bin/env bash
set -euo pipefail
query=""
next_token=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --query)
      query="$2"
      shift 2
      ;;
    --next-token)
      next_token="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ "$query" == "NextToken" ]]; then
  if [[ -z "$next_token" ]]; then
    echo "page-2"
  else
    echo "None"
  fi
  exit 0
fi

if [[ "$query" == *"starts_with(ServiceName, 'nyaaywatch-pr-')"* ]]; then
  if [[ -z "$next_token" ]]; then
    printf 'nyaaywatch-pr-173\\tnyaaywatch-pr-89\\n'
  else
    printf 'nyaaywatch-pr-92\\tnyaaywatch-pr-23\\n'
  fi
  exit 0
fi

echo "unexpected aws call: $query" >&2
exit 1
`,
    );

    chmodSync(deleteScriptPath, 0o755);
    chmodSync(awsPath, 0o755);

    execFileSync("bash", ["./infra/aws/preview/reconcile-services.sh", allowlistPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        DELETE_SERVICE_SCRIPT: deleteScriptPath,
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
      },
      stdio: "pipe",
    });

    expect(readFileSync(deletedLog, "utf8").trim().split("\n")).toEqual([
      "nyaaywatch-pr-92",
      "nyaaywatch-pr-23",
    ]);
  });

  it("finds services beyond the first App Runner page during delete", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "preview-delete-"));
    tempDirs.push(tempDir);

    const binDir = path.join(tempDir, "bin");
    const awsPath = path.join(binDir, "aws");
    const deletedFlag = path.join(tempDir, "deleted.flag");
    const deletedArnLog = path.join(tempDir, "deleted-arn.log");

    mkdirSync(binDir, { recursive: true });
    writeFileSync(
      awsPath,
      `#!/usr/bin/env bash
set -euo pipefail
command_name="$1 $2"
query=""
next_token=""
service_arn=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --query)
      query="$2"
      shift 2
      ;;
    --next-token)
      next_token="$2"
      shift 2
      ;;
    --service-arn)
      service_arn="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

case "$command_name" in
  "apprunner list-services")
    if [[ "$query" == "NextToken" ]]; then
      if [[ -z "$next_token" ]]; then
        echo "page-2"
      else
        echo "None"
      fi
      exit 0
    fi

    if [[ "$query" == *"ServiceName=='nyaaywatch-pr-23'"* ]]; then
      if [[ -z "$next_token" ]]; then
        echo "None"
      else
        echo "arn:aws:apprunner:ap-south-1:723951822728:service/nyaaywatch-pr-23/mock"
      fi
      exit 0
    fi
    ;;
  "apprunner describe-service")
    if [[ "$query" == "Service.Status" ]]; then
      if [[ -f "${deletedFlag}" ]]; then
        echo "MISSING"
      else
        echo "RUNNING"
      fi
      exit 0
    fi
    ;;
  "apprunner delete-service")
    printf '%s\n' "$service_arn" >> "${deletedArnLog}"
    touch "${deletedFlag}"
    exit 0
    ;;
esac

echo "unexpected aws command: $command_name / $query" >&2
exit 1
`,
    );
    chmodSync(awsPath, 0o755);

    execFileSync("bash", ["./infra/aws/preview/delete-service.sh", "nyaaywatch-pr-23"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
      },
      stdio: "pipe",
    });

    expect(readFileSync(deletedArnLog, "utf8").trim()).toBe(
      "arn:aws:apprunner:ap-south-1:723951822728:service/nyaaywatch-pr-23/mock",
    );
  });
});
