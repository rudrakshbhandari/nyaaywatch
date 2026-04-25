#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [stack-name]" >&2
  exit 1
fi

stack_name="${1:-nyaaywatch-staging}"
region="${AWS_REGION:-ap-south-1}"

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

cluster_name="$(
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue | [0]" \
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
  python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['taskDefinition'])" "$tmpdir/service.json"
)"

if [[ -z "$task_definition_arn" || "$task_definition_arn" == "None" ]]; then
  echo "Task definition not found for service $service_arn" >&2
  exit 1
fi

aws ecs describe-task-definition \
  --region "$region" \
  --task-definition "$task_definition_arn" \
  --query "taskDefinition" \
  --output json \
  > "$tmpdir/task-definition.json"

python3 - "$tmpdir/service.json" "$tmpdir/task-definition.json" "$tmpdir/run-task.json" <<'PY'
import json
import sys

service_path, task_def_path, target_path = sys.argv[1:]

with open(service_path, "r", encoding="utf-8") as handle:
    service = json.load(handle)

with open(task_def_path, "r", encoding="utf-8") as handle:
    task_definition = json.load(handle)

container_name = task_definition["containerDefinitions"][0]["name"]
network = service["networkConfiguration"]["awsvpcConfiguration"]

request = {
    "cluster": service["clusterArn"],
    "taskDefinition": task_definition["taskDefinitionArn"],
    "launchType": "FARGATE",
    "count": 1,
    "networkConfiguration": {
        "awsvpcConfiguration": {
            "subnets": network["subnets"],
            "securityGroups": network["securityGroups"],
            "assignPublicIp": network.get("assignPublicIp", "ENABLED"),
        }
    },
    "overrides": {
        "containerOverrides": [
            {
                "name": container_name,
                "command": [
                    "node",
                    "dist/src/dev/ecs-publish-pending-entrypoint.js",
                ],
            }
        ]
    },
}

with open(target_path, "w", encoding="utf-8") as handle:
    json.dump(request, handle)
PY

echo "Running publish-pending ECS task..."

task_arn="$(
  aws ecs run-task \
    --region "$region" \
    --cli-input-json "file://$tmpdir/run-task.json" \
    --query "tasks[0].taskArn" \
    --output text
)"

if [[ -z "$task_arn" || "$task_arn" == "None" ]]; then
  echo "Failed to start publish-pending ECS task" >&2
  exit 1
fi

echo "Task started: $task_arn"
echo "Waiting for task to complete..."

aws ecs wait tasks-stopped \
  --region "$region" \
  --cluster "$cluster_name" \
  --tasks "$task_arn"

exit_code="$(
  aws ecs describe-tasks \
    --region "$region" \
    --cluster "$cluster_name" \
    --tasks "$task_arn" \
    --query "tasks[0].containers[0].exitCode" \
    --output text
)"

echo "Publish-pending task exit code: $exit_code"

if [[ "$exit_code" != "0" ]]; then
  echo "Publish-pending task failed (exit code $exit_code)" >&2
  exit 1
fi
