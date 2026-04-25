#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [stack-name]" >&2
  echo "Env overrides: STATE_INTERNAL_FETCH_*, SUPREME_COURT_INTERNAL_FETCH_*, HIGH_COURT_INTERNAL_FETCH_*, PUBLIC_ALPHA_OPS_*, PUBLISH_PENDING_*, INTERNAL_FETCH_SCHEDULER_ROLE_ARN" >&2
  exit 1
fi

stack_name="${1:-nyaaywatch-staging}"
region="${AWS_REGION:-ap-south-1}"
state_schedule_expression="${STATE_INTERNAL_FETCH_SCHEDULE_EXPRESSION:-${INTERNAL_FETCH_SCHEDULE_EXPRESSION:-cron(0 8 * * ? *)}}"
state_schedule_timezone="${STATE_INTERNAL_FETCH_SCHEDULE_TIMEZONE:-${INTERNAL_FETCH_SCHEDULE_TIMEZONE:-Asia/Kolkata}}"
state_schedule_state="${STATE_INTERNAL_FETCH_SCHEDULE_STATE:-${INTERNAL_FETCH_SCHEDULE_STATE:-ENABLED}}"
state_schedule_name="${STATE_INTERNAL_FETCH_SCHEDULE_NAME:-${INTERNAL_FETCH_SCHEDULE_NAME:-${stack_name}-weekday-internal-fetch}}"
state_note_prefix="${STATE_INTERNAL_FETCH_NOTE_PREFIX:-${INTERNAL_FETCH_NOTE_PREFIX:-Scheduled daily lower-court internal raw fetch}}"
supreme_court_schedule_expression="${SUPREME_COURT_INTERNAL_FETCH_SCHEDULE_EXPRESSION:-cron(10 8 * * ? *)}"
supreme_court_schedule_timezone="${SUPREME_COURT_INTERNAL_FETCH_SCHEDULE_TIMEZONE:-Asia/Kolkata}"
supreme_court_schedule_state="${SUPREME_COURT_INTERNAL_FETCH_SCHEDULE_STATE:-ENABLED}"
supreme_court_schedule_name="${SUPREME_COURT_INTERNAL_FETCH_SCHEDULE_NAME:-${stack_name}-supreme-court-internal-fetch}"
supreme_court_note_prefix="${SUPREME_COURT_INTERNAL_FETCH_NOTE_PREFIX:-Scheduled daily Supreme Court internal raw fetch}"
high_court_schedule_expression="${HIGH_COURT_INTERNAL_FETCH_SCHEDULE_EXPRESSION:-cron(20 8 * * ? *)}"
high_court_schedule_timezone="${HIGH_COURT_INTERNAL_FETCH_SCHEDULE_TIMEZONE:-Asia/Kolkata}"
high_court_schedule_state="${HIGH_COURT_INTERNAL_FETCH_SCHEDULE_STATE:-ENABLED}"
high_court_schedule_name="${HIGH_COURT_INTERNAL_FETCH_SCHEDULE_NAME:-${stack_name}-high-courts-internal-fetch}"
high_court_note_prefix="${HIGH_COURT_INTERNAL_FETCH_NOTE_PREFIX:-Scheduled daily High Court internal raw fetch}"
public_alpha_ops_schedule_expression="${PUBLIC_ALPHA_OPS_SCHEDULE_EXPRESSION:-cron(0/30 * * * ? *)}"
public_alpha_ops_schedule_timezone="${PUBLIC_ALPHA_OPS_SCHEDULE_TIMEZONE:-Asia/Kolkata}"
public_alpha_ops_schedule_state="${PUBLIC_ALPHA_OPS_SCHEDULE_STATE:-ENABLED}"
public_alpha_ops_schedule_name="${PUBLIC_ALPHA_OPS_SCHEDULE_NAME:-${stack_name}-public-alpha-ops-monitor}"
public_alpha_ops_note_prefix="${PUBLIC_ALPHA_OPS_NOTE_PREFIX:-Scheduled public alpha ops verification}"
publish_pending_schedule_expression="${PUBLISH_PENDING_SCHEDULE_EXPRESSION:-cron(30 8 * * ? *)}"
publish_pending_schedule_timezone="${PUBLISH_PENDING_SCHEDULE_TIMEZONE:-Asia/Kolkata}"
publish_pending_schedule_state="${PUBLISH_PENDING_SCHEDULE_STATE:-ENABLED}"
publish_pending_schedule_name="${PUBLISH_PENDING_SCHEDULE_NAME:-${stack_name}-publish-pending-sweep}"
publish_pending_note_prefix="${PUBLISH_PENDING_NOTE_PREFIX:-Scheduled daily publish-pending sweep}"
role_name="${INTERNAL_FETCH_SCHEDULER_ROLE_NAME:-${stack_name}-internal-fetch-scheduler}"
role_policy_name="${INTERNAL_FETCH_SCHEDULER_POLICY_NAME:-${stack_name}-internal-fetch-scheduler}"
role_arn_override="${INTERNAL_FETCH_SCHEDULER_ROLE_ARN:-}"
manage_iam_mode="${INTERNAL_FETCH_MANAGE_IAM:-auto}"
schedule_group_name="${INTERNAL_FETCH_SCHEDULE_GROUP_NAME:-default}"

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

retry_scheduler_command() {
  local operation="$1"
  local request_path="$2"
  local region="$3"
  local attempt=1

  scheduler_command_output=""

  while true; do
    local output
    if output="$(
      aws scheduler "$operation" \
        --region "$region" \
        --cli-input-json "file://$request_path" \
        2>&1
    )"; then
      scheduler_command_output="$output"
      return 0
    fi

    if [[ "$output" != *"must allow AWS EventBridge Scheduler to assume the role"* || "$attempt" -ge 12 ]]; then
      scheduler_command_output="$output"
      return 1
    fi

    sleep 5
    attempt=$((attempt + 1))
  done
}

cluster_name="$(
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
    --output text
)"

service_arn="$(
  aws cloudformation describe-stack-resources \
    --region "$region" \
    --stack-name "$stack_name" \
    --logical-resource-id Service \
    --query "StackResources[0].PhysicalResourceId" \
    --output text
)"

if [[ -z "$cluster_name" || "$cluster_name" == "None" ]]; then
  echo "ClusterName output not found for stack $stack_name" >&2
  exit 1
fi

if [[ -z "$service_arn" || "$service_arn" == "None" ]]; then
  echo "Service resource not found for stack $stack_name" >&2
  exit 1
fi

aws ecs describe-services \
  --region "$region" \
  --cluster "$cluster_name" \
  --services "$service_arn" \
  --query "services[0]" \
  --output json \
  > "$tmpdir/service.json"

task_definition_arn="$(
  python3 - "$tmpdir/service.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    service = json.load(handle)

print(service.get("taskDefinition", ""))
PY
)"

if [[ -z "$task_definition_arn" ]]; then
  echo "Task definition not found for service $service_arn" >&2
  exit 1
fi

aws ecs describe-task-definition \
  --region "$region" \
  --task-definition "$task_definition_arn" \
  --output json \
  > "$tmpdir/task-definition.json"

schedule_exists="false"
if [[ -z "$role_arn_override" ]]; then
  if aws scheduler get-schedule \
    --region "$region" \
    --group-name "$schedule_group_name" \
    --name "$state_schedule_name" \
    --output json \
    > "$tmpdir/existing-schedule.json" 2>/dev/null; then
    schedule_exists="true"
  fi
fi

role_exists="false"
iam_can_manage_role="false"
role_arn=""

if [[ -n "$role_arn_override" ]]; then
  role_arn="$role_arn_override"
fi

iam_get_role_output=""
if iam_get_role_output="$(aws iam get-role --role-name "$role_name" --output json 2>&1)"; then
  role_exists="true"
  iam_can_manage_role="true"
  role_arn="$(
    python3 - <<'PY' "$iam_get_role_output"
import json
import sys

print(json.loads(sys.argv[1])["Role"]["Arn"])
PY
  )"
elif [[ "$iam_get_role_output" == *"NoSuchEntity"* ]]; then
  role_exists="false"
  iam_can_manage_role="true"
elif [[ "$manage_iam_mode" == "always" ]]; then
  echo "$iam_get_role_output" >&2
  exit 1
elif [[ "$schedule_exists" == "true" && -z "$role_arn" ]]; then
  role_arn="$(
    python3 - "$tmpdir/existing-schedule.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    schedule = json.load(handle)

print(schedule["Target"]["RoleArn"])
PY
  )"
fi

if [[ "$manage_iam_mode" != "auto" && "$manage_iam_mode" != "always" && "$manage_iam_mode" != "never" ]]; then
  echo "INTERNAL_FETCH_MANAGE_IAM must be one of auto, always, never" >&2
  exit 1
fi

manage_iam="false"
if [[ "$manage_iam_mode" == "always" ]]; then
  manage_iam="true"
elif [[ "$manage_iam_mode" == "auto" && "$iam_can_manage_role" == "true" ]]; then
  manage_iam="true"
fi

cat > "$tmpdir/trust-policy.json" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "scheduler.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

if [[ "$manage_iam" == "true" ]]; then
  if [[ "$role_exists" != "true" ]]; then
    aws iam create-role \
      --role-name "$role_name" \
      --assume-role-policy-document "file://$tmpdir/trust-policy.json" \
      >/dev/null
  else
    aws iam update-assume-role-policy \
      --role-name "$role_name" \
      --policy-document "file://$tmpdir/trust-policy.json" \
      >/dev/null
  fi
fi

python3 - "$tmpdir/task-definition.json" "$tmpdir/role-policy.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    task_definition = json.load(handle)["taskDefinition"]

resources = [task_definition["taskRoleArn"]]
execution_role = task_definition.get("executionRoleArn")
if execution_role:
    resources.append(execution_role)

task_definition_resource = task_definition["taskDefinitionArn"].rsplit(":", 1)[0] + ":*"

policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["ecs:RunTask"],
            "Resource": task_definition_resource,
        },
        {
            "Effect": "Allow",
            "Action": ["iam:PassRole"],
            "Resource": resources,
        },
    ],
}

with open(sys.argv[2], "w", encoding="utf-8") as handle:
    json.dump(policy, handle)
PY

if [[ "$manage_iam" == "true" ]]; then
  aws iam put-role-policy \
    --role-name "$role_name" \
    --policy-name "$role_policy_name" \
    --policy-document "file://$tmpdir/role-policy.json" \
    >/dev/null
fi

if [[ -z "$role_arn" && "$manage_iam" == "true" ]]; then
  role_arn="$(
    aws iam get-role \
      --role-name "$role_name" \
      --query "Role.Arn" \
      --output text
  )"
fi

if [[ -z "$role_arn" ]]; then
  echo "Scheduler role ARN is unavailable. Either grant IAM read access, set INTERNAL_FETCH_SCHEDULER_ROLE_ARN, or bootstrap the schedule manually first." >&2
  exit 1
fi

reconcile_schedule() {
  local schedule_name="$1"
  local schedule_expression="$2"
  local schedule_timezone="$3"
  local schedule_state="$4"
  local schedule_description="$5"
  local entrypoint_path="$6"
  local note_prefix="$7"
  local request_path="$tmpdir/${schedule_name}.json"

  python3 - \
    "$tmpdir/service.json" \
    "$tmpdir/task-definition.json" \
    "$request_path" \
    "$schedule_name" \
    "$schedule_group_name" \
    "$schedule_expression" \
    "$schedule_timezone" \
    "$schedule_state" \
    "$note_prefix" \
    "$role_arn" \
    "$schedule_description" \
    "$entrypoint_path" <<'PY'
import json
import sys

(
    service_path,
    task_definition_path,
    target_path,
    schedule_name,
    schedule_group_name,
    schedule_expression,
    schedule_timezone,
    schedule_state,
    note_prefix,
    role_arn,
    schedule_description,
    entrypoint_path,
) = sys.argv[1:]

with open(service_path, "r", encoding="utf-8") as handle:
    service = json.load(handle)

with open(task_definition_path, "r", encoding="utf-8") as handle:
    task_definition = json.load(handle)["taskDefinition"]

container_name = task_definition["containerDefinitions"][0]["name"]
network = service["networkConfiguration"]["awsvpcConfiguration"]

command = [
    "node",
    entrypoint_path,
    f"{note_prefix} (<aws.scheduler.scheduled-time>)",
]

request = {
    "Name": schedule_name,
    "GroupName": schedule_group_name,
    "Description": schedule_description,
    "FlexibleTimeWindow": {"Mode": "OFF"},
    "ScheduleExpression": schedule_expression,
    "ScheduleExpressionTimezone": schedule_timezone,
    "State": schedule_state,
    "Target": {
        "Arn": service["clusterArn"],
        "RoleArn": role_arn,
        "RetryPolicy": {
            "MaximumEventAgeInSeconds": 3600,
            "MaximumRetryAttempts": 2,
        },
        "EcsParameters": {
            "LaunchType": "FARGATE",
            "TaskCount": 1,
            "TaskDefinitionArn": task_definition["taskDefinitionArn"],
            "EnableECSManagedTags": False,
            "EnableExecuteCommand": False,
            "NetworkConfiguration": {
                "awsvpcConfiguration": {
                    "Subnets": network["subnets"],
                    "SecurityGroups": network["securityGroups"],
                    "AssignPublicIp": network.get("assignPublicIp", "ENABLED"),
                }
            },
        },
        "Input": json.dumps(
            {
                "containerOverrides": [
                    {
                        "name": container_name,
                        "command": command,
                    }
                ]
            }
        ),
    },
}

with open(target_path, "w", encoding="utf-8") as handle:
    json.dump(request, handle)
PY

  if retry_scheduler_command update-schedule "$request_path" "$region"; then
    action="updated"
  elif [[ "$scheduler_command_output" == *"ResourceNotFoundException"* ]]; then
    if ! retry_scheduler_command create-schedule "$request_path" "$region"; then
      echo "$scheduler_command_output" >&2
      exit 1
    fi
    action="created"
  else
    echo "$scheduler_command_output" >&2
    exit 1
  fi

  aws scheduler get-schedule \
    --region "$region" \
    --group-name "$schedule_group_name" \
    --name "$schedule_name" \
    --query "{action:'$action',name:Name,state:State,scheduleExpression:ScheduleExpression,scheduleExpressionTimezone:ScheduleExpressionTimezone,description:Description,targetArn:Target.Arn,targetTaskDefinition:Target.EcsParameters.TaskDefinitionArn}" \
    --output json
}

reconcile_schedule \
  "$state_schedule_name" \
  "$state_schedule_expression" \
  "$state_schedule_timezone" \
  "$state_schedule_state" \
  "Daily internal raw fetch across all implemented lower-court state profiles. This schedule does not publish public snapshots." \
  "dist/src/dev/ecs-scheduled-fetch-entrypoint.js" \
  "$state_note_prefix"

reconcile_schedule \
  "$supreme_court_schedule_name" \
  "$supreme_court_schedule_expression" \
  "$supreme_court_schedule_timezone" \
  "$supreme_court_schedule_state" \
  "Daily internal raw fetch for the Supreme Court of India. This schedule does not publish public snapshots." \
  "dist/src/dev/ecs-scheduled-supreme-court-fetch-entrypoint.js" \
  "$supreme_court_note_prefix"

reconcile_schedule \
  "$high_court_schedule_name" \
  "$high_court_schedule_expression" \
  "$high_court_schedule_timezone" \
  "$high_court_schedule_state" \
  "Daily internal raw fetch across reviewed High Court profiles. This schedule does not publish public snapshots." \
  "dist/src/dev/ecs-scheduled-high-court-fetch-entrypoint.js" \
  "$high_court_note_prefix"

reconcile_schedule \
  "$public_alpha_ops_schedule_name" \
  "$public_alpha_ops_schedule_expression" \
  "$public_alpha_ops_schedule_timezone" \
  "$public_alpha_ops_schedule_state" \
  "Scheduled public alpha verification across every live public state. Failures emit alert log lines and trigger the staging SNS alarm path." \
  "dist/src/dev/ecs-public-alpha-ops-entrypoint.js" \
  "$public_alpha_ops_note_prefix"

reconcile_schedule \
  "$publish_pending_schedule_name" \
  "$publish_pending_schedule_expression" \
  "$publish_pending_schedule_timezone" \
  "$publish_pending_schedule_state" \
  "Daily publish-pending sweep across every implemented court tier. Publishes any quality-complete runs from the last 3 days that have no newer publication, via the auto-publish gate." \
  "dist/src/dev/ecs-publish-pending-entrypoint.js" \
  "$publish_pending_note_prefix"
