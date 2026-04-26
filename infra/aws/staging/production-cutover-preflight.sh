#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: infra/aws/staging/production-cutover-preflight.sh [legacy-stack] [target-stack]

Defaults:
  legacy-stack = nyaaywatch-staging
  target-stack = nyaaywatch-production

Environment:
  AWS_REGION=ap-south-1
  PUBLIC_BASE_URL=https://nyaaywatch.in
  ALLOW_EXISTING_TARGET_STACK=false

This is a read-only preflight. It describes CloudFormation outputs and checks
public health, but it does not deploy, rename, update, delete, or cut over AWS
resources.
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
allow_existing_target_stack="${ALLOW_EXISTING_TARGET_STACK:-false}"

if [[ "$allow_existing_target_stack" != "true" && "$allow_existing_target_stack" != "false" ]]; then
  echo "ALLOW_EXISTING_TARGET_STACK must be true or false." >&2
  exit 1
fi

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

stack_status() {
  local stack_name="$1"
  local output
  if output="$(
    aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].StackStatus" \
      --output text \
      2>&1
  )"; then
    printf "%s" "$output"
    return 0
  fi

  if [[ "$output" == *"does not exist"* ]]; then
    return 2
  fi

  echo "$output" >&2
  return 1
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

print_output() {
  local stack_name="$1"
  local output_key="$2"
  local value
  value="$(stack_output "$stack_name" "$output_key")"
  if [[ -z "$value" || "$value" == "None" ]]; then
    echo "  - $output_key: MISSING"
    return 1
  fi

  echo "  - $output_key: $value"
}

require_command aws
require_command curl

echo "Production cutover preflight"
echo "  region: $region"
echo "  current production backing stack: $legacy_stack"
echo "  target production stack: $target_stack"
echo "  public base URL: $public_base_url"
echo

legacy_status=""
set +e
legacy_status="$(stack_status "$legacy_stack")"
status_code=$?
set -e
if [[ "$status_code" -ne 0 ]]; then
  if [[ "$status_code" -eq 2 ]]; then
    echo "Current production backing stack was not found: $legacy_stack" >&2
    exit 1
  fi
  echo "Could not read current production backing stack: $legacy_stack" >&2
  exit 1
fi

if [[ -z "$legacy_status" || "$legacy_status" == "None" ]]; then
  echo "Current production backing stack was not found: $legacy_stack" >&2
  exit 1
fi

if [[ "$legacy_status" == DELETE_* || "$legacy_status" == *"_FAILED" ]]; then
  echo "Current production backing stack is not in a cutover-safe status: $legacy_status" >&2
  exit 1
fi

echo "Current production backing stack status: $legacy_status"
echo "Required current-stack outputs:"
missing_output=false
for output_key in \
  ServiceUrl \
  ArtifactsBucketName \
  DatabaseEndpoint \
  DatabaseUrlSecretArn \
  OperatorApiTokenSecretArn \
  CertificateArn \
  AlarmTopicArn \
  ClusterName
do
  if ! print_output "$legacy_stack" "$output_key"; then
    missing_output=true
  fi
done

if [[ "$missing_output" == "true" ]]; then
  echo "Current production backing stack is missing required outputs." >&2
  exit 1
fi

echo
target_status=""
target_stack_exists=false
set +e
target_status="$(stack_status "$target_stack")"
status_code=$?
set -e
if [[ "$status_code" -eq 0 ]]; then
  target_stack_exists=true
else
  if [[ "$status_code" -ne 2 ]]; then
    echo "Could not read target production stack: $target_stack" >&2
    exit 1
  fi
fi

if [[ "$target_stack_exists" == "true" && -n "$target_status" && "$target_status" != "None" ]]; then
  echo "Target production stack already exists: $target_stack ($target_status)"
  echo "Review this stack before proceeding; preflight will not assume it is safe to cut over."
  echo "Target-stack outputs:"
  for output_key in ServiceUrl ArtifactsBucketName DatabaseEndpoint CertificateArn AlarmTopicArn ClusterName; do
    print_output "$target_stack" "$output_key" || true
  done

  if [[ "$allow_existing_target_stack" != "true" ]]; then
    echo "Set ALLOW_EXISTING_TARGET_STACK=true only after reviewing that existing target stack." >&2
    exit 1
  fi
else
  echo "Target production stack does not exist yet, which is expected before the parallel deploy."
fi

echo
echo "Checking public production health..."
health_payload="$(curl --fail --silent --show-error --location "$public_base_url/health")"
if [[ "$health_payload" != *'"ok":true'* ]]; then
  echo "Public health endpoint returned an unexpected payload: $health_payload" >&2
  exit 1
fi
echo "$health_payload"

echo
echo "Preflight passed. Safe next action is a separate parallel deploy of $target_stack; do not rename or mutate $legacy_stack in place."
