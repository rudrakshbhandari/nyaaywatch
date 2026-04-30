#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: infra/aws/staging/production-cutover-inventory.sh [legacy-stack] [target-stack]

Defaults:
  legacy-stack = nyaaywatch-staging
  target-stack = nyaaywatch-production

Environment:
  AWS_REGION=ap-south-1
  PUBLIC_BASE_URL=https://nyaaywatch.in

This is read-only. It runs the production preflight, then prints the live stack,
ECS task, schedule, secret-ARN, and target-stack inventory needed before a
parallel production cutover.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -gt 2 ]]; then
  usage
  exit 1
fi

legacy_stack="${1:-nyaaywatch-staging}"
target_stack="${2:-nyaaywatch-production}"
region="${AWS_REGION:-ap-south-1}"
public_base_url="${PUBLIC_BASE_URL:-https://nyaaywatch.in}"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

stack_output() {
  local stack_name="$1"
  local output_key="$2"
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue | [0]" \
    --output text \
    2>/dev/null || true
}

stack_status() {
  local stack_name="$1"
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].StackStatus" \
    --output text \
    2>/dev/null || true
}

stack_resource() {
  local stack_name="$1"
  local logical_resource_id="$2"
  aws cloudformation describe-stack-resources \
    --region "$region" \
    --stack-name "$stack_name" \
    --logical-resource-id "$logical_resource_id" \
    --query "StackResources[0].PhysicalResourceId" \
    --output text \
    2>/dev/null || true
}

task_env_value() {
  local task_definition_arn="$1"
  local env_name="$2"
  aws ecs describe-task-definition \
    --region "$region" \
    --task-definition "$task_definition_arn" \
    --query "taskDefinition.containerDefinitions[0].environment[?name=='$env_name'].value | [0]" \
    --output text \
    2>/dev/null || true
}

task_secret_value_from() {
  local task_definition_arn="$1"
  local secret_name="$2"
  aws ecs describe-task-definition \
    --region "$region" \
    --task-definition "$task_definition_arn" \
    --query "taskDefinition.containerDefinitions[0].secrets[?name=='$secret_name'].valueFrom | [0]" \
    --output text \
    2>/dev/null || true
}

task_image() {
  local task_definition_arn="$1"
  aws ecs describe-task-definition \
    --region "$region" \
    --task-definition "$task_definition_arn" \
    --query "taskDefinition.containerDefinitions[0].image" \
    --output text
}

schedule_target_task_definition() {
  local schedule_name="$1"
  aws scheduler get-schedule \
    --region "$region" \
    --group-name default \
    --name "$schedule_name" \
    --query "Target.EcsParameters.TaskDefinitionArn" \
    --output text \
    2>/dev/null || true
}

require_command aws
require_command curl

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$script_dir/production-cutover-preflight.sh" "$legacy_stack" "$target_stack"

echo
echo "Production cutover inventory"
echo "  region: $region"
echo "  public base URL: $public_base_url"
echo "  current production backing stack: $legacy_stack"
echo "  target production stack: $target_stack"
echo

cluster_name="$(stack_output "$legacy_stack" ClusterName)"
service_arn="$(stack_resource "$legacy_stack" Service)"
service_url="$(stack_output "$legacy_stack" ServiceUrl)"
artifacts_bucket="$(stack_output "$legacy_stack" ArtifactsBucketName)"
database_instance_identifier="$(stack_resource "$legacy_stack" StagingDatabase)"
database_endpoint="$(stack_output "$legacy_stack" DatabaseEndpoint)"
database_url_secret_arn="$(stack_output "$legacy_stack" DatabaseUrlSecretArn)"
operator_api_token_secret_arn="$(stack_output "$legacy_stack" OperatorApiTokenSecretArn)"
cloudflare_api_token_secret_arn="$(stack_output "$legacy_stack" CloudflareApiTokenSecretArn)"
certificate_arn="$(stack_output "$legacy_stack" CertificateArn)"
alarm_topic_arn="$(stack_output "$legacy_stack" AlarmTopicArn)"

task_definition_arn="$(
  aws ecs describe-services \
    --region "$region" \
    --cluster "$cluster_name" \
    --services "$service_arn" \
    --query "services[0].taskDefinition" \
    --output text
)"

echo "Current stack outputs:"
echo "  ServiceUrl: $service_url"
echo "  ArtifactsBucketName: $artifacts_bucket"
echo "  DatabaseInstanceIdentifier: $database_instance_identifier"
echo "  DatabaseEndpoint: $database_endpoint"
echo "  DatabaseUrlSecretArn: $database_url_secret_arn"
echo "  OperatorApiTokenSecretArn: $operator_api_token_secret_arn"
echo "  CloudflareApiTokenSecretArn: ${cloudflare_api_token_secret_arn:-None}"
echo "  CertificateArn: $certificate_arn"
echo "  AlarmTopicArn: $alarm_topic_arn"
echo "  ClusterName: $cluster_name"
echo "  ServiceArn: $service_arn"
echo

echo "Current ECS runtime:"
echo "  TaskDefinitionArn: $task_definition_arn"
echo "  ContainerImage: $(task_image "$task_definition_arn")"
echo "  DEPLOY_ENV: $(task_env_value "$task_definition_arn" DEPLOY_ENV)"
echo "  PUBLIC_BASE_URL: $(task_env_value "$task_definition_arn" PUBLIC_BASE_URL)"
echo "  S3_BUCKET: $(task_env_value "$task_definition_arn" S3_BUCKET)"
echo "  DATABASE_URL secret: $(task_secret_value_from "$task_definition_arn" DATABASE_URL)"
echo "  OPERATOR_API_TOKEN secret: $(task_secret_value_from "$task_definition_arn" OPERATOR_API_TOKEN)"
echo "  CLOUDFLARE_API_TOKEN secret: $(task_secret_value_from "$task_definition_arn" CLOUDFLARE_API_TOKEN)"
echo

echo "Current scheduler targets:"
for schedule_name in \
  "$legacy_stack-weekday-internal-fetch" \
  "$legacy_stack-supreme-court-internal-fetch" \
  "$legacy_stack-high-courts-internal-fetch" \
  "$legacy_stack-publish-pending-sweep" \
  "$legacy_stack-public-alpha-ops-monitor"
do
  echo "  $schedule_name: $(schedule_target_task_definition "$schedule_name")"
done
echo

target_status="$(stack_status "$target_stack")"
if [[ -z "$target_status" || "$target_status" == "None" ]]; then
  echo "Target stack status: not provisioned"
else
  echo "Target stack status: $target_status"
  echo "Target stack outputs:"
  for output_key in ServiceUrl ArtifactsBucketName DatabaseEndpoint DatabaseUrlSecretArn OperatorApiTokenSecretArn CertificateArn AlarmTopicArn ClusterName; do
    echo "  $output_key: $(stack_output "$target_stack" "$output_key")"
  done
fi
echo

echo "Cutover data decision still required before DNS:"
echo "  - preferred path: create a manual RDS snapshot from $database_instance_identifier, then deploy the target stack with DATABASE_SNAPSHOT_IDENTIFIER set to that snapshot ID"
echo "  - sync the current artifacts bucket into the target production artifacts bucket if the target uses a new S3 bucket"
echo "  - bridge-only path: explicitly choose shared-database cutover with a documented rollback tradeoff"
echo "  - keep schedules disabled or unconfigured on the target stack until the DNS cutover window"
echo
echo "Inventory complete. No AWS resources were changed."
