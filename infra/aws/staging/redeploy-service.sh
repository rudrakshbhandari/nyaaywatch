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

lookup_stack_resource() {
  local logical_resource_id="$1"
  aws cloudformation describe-stack-resources \
    --region "$region" \
    --stack-name "$stack_name" \
    --logical-resource-id "$logical_resource_id" \
    --query "StackResources[0].PhysicalResourceId" \
    --output text \
    2>/dev/null || true
}

lookup_stack_output() {
  local output_key="$1"
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue | [0]" \
    --output text \
    2>/dev/null || true
}

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

database_url_secret_arn="$(lookup_stack_output DatabaseUrlSecretArn)"
operator_api_token_secret_arn="$(lookup_stack_output OperatorApiTokenSecretArn)"
cloudflare_api_token_secret_arn="$(lookup_stack_output CloudflareApiTokenSecretArn)"

if [[ -z "$database_url_secret_arn" || "$database_url_secret_arn" == "None" ]]; then
  database_url_secret_arn="$(lookup_stack_resource DatabaseUrlSecret)"
fi

if [[ -z "$operator_api_token_secret_arn" || "$operator_api_token_secret_arn" == "None" ]]; then
  operator_api_token_secret_arn="$(lookup_stack_resource OperatorApiTokenSecret)"
fi

if [[ -n "$database_url_secret_arn" && "$database_url_secret_arn" != "None" ]]; then
  export DATABASE_URL_SECRET_ARN="$database_url_secret_arn"
fi

if [[ -n "$operator_api_token_secret_arn" && "$operator_api_token_secret_arn" != "None" ]]; then
  export OPERATOR_API_TOKEN_SECRET_ARN="$operator_api_token_secret_arn"
fi

if [[ -n "$cloudflare_api_token_secret_arn" && "$cloudflare_api_token_secret_arn" != "None" ]]; then
  export CLOUDFLARE_API_TOKEN_SECRET_ARN="$cloudflare_api_token_secret_arn"
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
import os
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

environment = task_definition["containerDefinitions"][0].setdefault("environment", [])
environment_map = {entry["name"]: entry.get("value", "") for entry in environment}
secrets = task_definition["containerDefinitions"][0].setdefault("secrets", [])
secret_map = {entry["name"]: entry.get("valueFrom", "") for entry in secrets}

environment_map.pop("CLOUDFLARE_API_TOKEN", None)

for env_name in ("CLOUDFLARE_ZONE_ID", "CLOUDFLARE_ZONE_NAME", "PUBLIC_BASE_URL"):
    env_value = os.environ.get(env_name)
    if env_value:
        environment_map[env_name] = env_value

for env_name, secret_env_name in (
    ("DATABASE_URL", "DATABASE_URL_SECRET_ARN"),
    ("OPERATOR_API_TOKEN", "OPERATOR_API_TOKEN_SECRET_ARN"),
):
    secret_arn = os.environ.get(secret_env_name, "").strip()
    if secret_arn:
        environment_map.pop(env_name, None)
        secret_map[env_name] = secret_arn
    elif env_name in environment_map and env_name not in secret_map:
        print(
            f"warning: {env_name} remains in the ECS environment because {secret_env_name} is not configured for this stack.",
            file=sys.stderr,
        )

cloudflare_secret_arn = os.environ.get("CLOUDFLARE_API_TOKEN_SECRET_ARN")
if cloudflare_secret_arn:
    secret_map["CLOUDFLARE_API_TOKEN"] = cloudflare_secret_arn

task_definition["containerDefinitions"][0]["environment"] = [
    {"name": name, "value": value} for name, value in sorted(environment_map.items())
]
task_definition["containerDefinitions"][0]["secrets"] = [
    {"name": name, "valueFrom": value} for name, value in sorted(secret_map.items()) if value
]

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
  if health_payload="$(curl --fail --silent --show-error --location --insecure "$service_url/health")"; then
    if [[ "$health_payload" == *'"ok":true'* ]]; then
      echo "$health_payload"
      exit 0
    fi
    echo "Health endpoint returned an unexpected payload: $health_payload" >&2
  fi
  sleep 10
done

echo "Service deployment reached ECS steady state, but $service_url/health did not return success." >&2
exit 1
