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
delete_service_script="${DELETE_SERVICE_SCRIPT:-./infra/aws/preview/delete-service.sh}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$script_dir/service-lookup.sh"

if [[ ! -f "$allowlist_file" ]]; then
  echo "Allowlist file not found: $allowlist_file" >&2
  exit 1
fi

log() {
  echo "[reconcile-services] $*" >&2
}

existing_services=()
while IFS= read -r service_name; do
  existing_services+=("$service_name")
done < <(apprunner_list_service_names_by_prefix "$region" "$service_prefix")

if [[ ${#existing_services[@]} -eq 0 ]]; then
  log "no preview services found for prefix $service_prefix"
  exit 0
fi

for service_name in "${existing_services[@]}"; do
  if grep -Fqx "$service_name" "$allowlist_file"; then
    log "keeping active preview service $service_name"
    continue
  fi

  log "deleting stale preview service $service_name"
  "$delete_service_script" "$service_name"
done
