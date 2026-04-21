#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <allowlist-file>" >&2
  echo "Example: $0 /tmp/open-preview-services.txt" >&2
  exit 1
fi

allowlist_file="$1"
region="${AWS_REGION:-ap-south-1}"
service_prefix="${PREVIEW_SERVICE_PREFIX:-nyaaywatch-pr-}"

if [[ ! -f "$allowlist_file" ]]; then
  echo "Allowlist file not found: $allowlist_file" >&2
  exit 1
fi

log() {
  echo "[reconcile-services] $*" >&2
}

declare -A keep_services=()
while IFS= read -r line; do
  service_name="${line//$'\r'/}"
  if [[ -n "$service_name" ]]; then
    keep_services["$service_name"]=1
  fi
done < "$allowlist_file"

mapfile -t existing_services < <(
  aws apprunner list-services \
    --region "$region" \
    --query "ServiceSummaryList[?starts_with(ServiceName, '${service_prefix}')].ServiceName" \
    --output text | tr '\t' '\n' | sed '/^$/d;/^None$/d'
)

if [[ ${#existing_services[@]} -eq 0 ]]; then
  log "no preview services found for prefix $service_prefix"
  exit 0
fi

for service_name in "${existing_services[@]}"; do
  if [[ -n "${keep_services[$service_name]:-}" ]]; then
    log "keeping active preview service $service_name"
    continue
  fi

  log "deleting stale preview service $service_name"
  ./infra/aws/preview/delete-service.sh "$service_name"
done
