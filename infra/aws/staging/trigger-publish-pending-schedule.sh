#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [stack-name]" >&2
  exit 1
fi

stack_name="${1:-nyaaywatch-production}"
region="${AWS_REGION:-ap-south-1}"
schedule_name="${PUBLISH_PENDING_SCHEDULE_NAME:-${stack_name}-publish-pending-sweep}"
schedule_group="${PUBLISH_PENDING_SCHEDULE_GROUP:-default}"

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

aws scheduler get-schedule \
  --region "$region" \
  --name "$schedule_name" \
  --group-name "$schedule_group" \
  --output json \
  > "$tmpdir/original.json"

python3 - "$tmpdir/original.json" "$tmpdir/trigger.json" "$tmpdir/restore.json" <<'PY'
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone

source_path, trigger_path, restore_path = sys.argv[1:]

with open(source_path, "r", encoding="utf-8") as handle:
    original = json.load(handle)

allowed = {
    "Name",
    "GroupName",
    "Description",
    "StartDate",
    "EndDate",
    "ScheduleExpression",
    "ScheduleExpressionTimezone",
    "State",
    "KmsKeyArn",
    "FlexibleTimeWindow",
    "Target",
    "ActionAfterCompletion",
}

base = {key: value for key, value in original.items() if key in allowed and value is not None}
base["Name"] = original["Name"]
base["GroupName"] = original.get("GroupName", "default")
base["State"] = "ENABLED"

restore = dict(base)
restore.pop("ActionAfterCompletion", None)

trigger = dict(base)
trigger_at = (datetime.now(timezone.utc) + timedelta(minutes=2)).replace(second=0, microsecond=0)
trigger["ScheduleExpression"] = f"at({trigger_at.strftime('%Y-%m-%dT%H:%M:%S')})"
trigger["ScheduleExpressionTimezone"] = "UTC"
trigger["ActionAfterCompletion"] = "NONE"

with open(trigger_path, "w", encoding="utf-8") as handle:
    json.dump(trigger, handle)

with open(restore_path, "w", encoding="utf-8") as handle:
    json.dump(restore, handle)

print(trigger["ScheduleExpression"])
PY

restore_schedule() {
  aws scheduler update-schedule \
    --region "$region" \
    --cli-input-json "file://$tmpdir/restore.json" \
    >/dev/null
}
trap 'restore_schedule; cleanup' EXIT

echo "Triggering $schedule_name once through EventBridge Scheduler..."
aws scheduler update-schedule \
  --region "$region" \
  --cli-input-json "file://$tmpdir/trigger.json" \
  >/dev/null

echo "Waiting for the one-time scheduler window to fire..."
sleep "${PUBLISH_PENDING_TRIGGER_WAIT_SECONDS:-180}"

echo "Restoring $schedule_name to its original expression..."
restore_schedule
trap cleanup EXIT
