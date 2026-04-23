#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <service-name>" >&2
  echo "Example: $0 nyaaywatch-pr-21" >&2
  exit 1
fi

service_name="$1"
region="${AWS_REGION:-ap-south-1}"
poll_interval_seconds=10
settle_timeout_seconds=600
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$script_dir/service-lookup.sh"

log() {
  echo "[delete-service] $*" >&2
}

describe_status() {
  local arn="$1"
  aws apprunner describe-service \
    --region "$region" \
    --service-arn "$arn" \
    --query "Service.Status" \
    --output text 2>/dev/null || echo "MISSING"
}

service_arn="$(apprunner_find_service_arn_by_name "$region" "$service_name")"

if [[ -z "$service_arn" || "$service_arn" == "None" ]]; then
  echo "Service $service_name already absent."
  exit 0
fi

deadline=$(($(date +%s) + settle_timeout_seconds))
while :; do
  status="$(describe_status "$service_arn")"
  case "$status" in
    OPERATION_IN_PROGRESS|CREATING|PENDING_CREATION)
      if (( $(date +%s) >= deadline )); then
        log "timed out waiting for $service_name to leave transitional state $status"
        exit 1
      fi
      log "service $service_name is $status, waiting ${poll_interval_seconds}s before delete..."
      sleep "$poll_interval_seconds"
      ;;
    DELETING|DELETED|MISSING)
      echo "Service $service_name already deleting or absent."
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

aws apprunner delete-service \
  --region "$region" \
  --service-arn "$service_arn" \
  >/dev/null

echo "Deleted $service_name"
