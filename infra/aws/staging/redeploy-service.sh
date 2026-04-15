#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <stack-name> <container-image-uri>" >&2
  echo "Example: $0 nyaaywatch-staging 723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:3e9a507" >&2
  exit 1
fi

stack_name="$1"
container_image="$2"
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

service_url="$(
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='ServiceUrl'].OutputValue" \
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

if [[ -z "$service_url" || "$service_url" == "None" ]]; then
  echo "ServiceUrl output not found for stack $stack_name" >&2
  exit 1
fi

task_definition_arn="$(
  aws ecs describe-services \
    --region "$region" \
    --cluster "$cluster_name" \
    --services "$service_arn" \
    --query "services[0].taskDefinition" \
    --output text
)"

if [[ -z "$task_definition_arn" || "$task_definition_arn" == "None" ]]; then
  echo "Task definition not found for service $service_arn" >&2
  exit 1
fi

aws ecs describe-task-definition \
  --region "$region" \
  --task-definition "$task_definition_arn" \
  --query "taskDefinition" \
  > "$tmpdir/current-task-definition.json"

python3 - "$tmpdir/current-task-definition.json" "$tmpdir/register-task-definition.json" "$container_image" <<'PY'
import json
import sys

source_path, target_path, image_uri = sys.argv[1:]

with open(source_path, "r", encoding="utf-8") as source_file:
    task_definition = json.load(source_file)

for key in (
    "taskDefinitionArn",
    "revision",
    "status",
    "requiresAttributes",
    "compatibilities",
    "registeredAt",
    "registeredBy",
    "deregisteredAt",
):
    task_definition.pop(key, None)

task_definition["containerDefinitions"][0]["image"] = image_uri

with open(target_path, "w", encoding="utf-8") as target_file:
    json.dump(task_definition, target_file)
PY

new_task_definition_arn="$(
  aws ecs register-task-definition \
    --region "$region" \
    --cli-input-json "file://$tmpdir/register-task-definition.json" \
    --query "taskDefinition.taskDefinitionArn" \
    --output text
)"

aws ecs update-service \
  --region "$region" \
  --cluster "$cluster_name" \
  --service "$service_arn" \
  --task-definition "$new_task_definition_arn" \
  >/dev/null

aws ecs wait services-stable \
  --region "$region" \
  --cluster "$cluster_name" \
  --services "$service_arn"

for attempt in {1..12}; do
  if health_payload="$(curl --fail --silent --show-error "$service_url/health")"; then
    echo "$health_payload"
    exit 0
  fi
  sleep 10
done

echo "Service deployment reached ECS steady state, but $service_url/health did not return success." >&2
exit 1
