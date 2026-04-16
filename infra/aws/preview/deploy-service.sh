#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <service-name> <image-uri> <access-role-arn>" >&2
  echo "Example: $0 nyaaywatch-pr-21 723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:pr-21-abc arn:aws:iam::123456789012:role/nyaaywatch-apprunner-ecr-access-role" >&2
  exit 1
fi

service_name="$1"
image_uri="$2"
access_role_arn="$3"
region="${AWS_REGION:-ap-south-1}"

# Poll cadence and ceilings. App Runner state changes typically land in
# 2-5 minutes; anything past 15 minutes is effectively stuck and we surface
# it as a failure rather than silently posting a URL that will never resolve.
poll_interval_seconds=10
settle_timeout_seconds=900
deploy_timeout_seconds=900
delete_timeout_seconds=600

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

cat > "$tmpdir/source-configuration.json" <<EOF
{
  "AutoDeploymentsEnabled": false,
  "AuthenticationConfiguration": {
    "AccessRoleArn": "$access_role_arn"
  },
  "ImageRepository": {
    "ImageIdentifier": "$image_uri",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "3000",
      "RuntimeEnvironmentVariables": {
        "APP_MODE": "preview",
        "PORT": "3000"
      }
    }
  }
}
EOF

log() {
  echo "[deploy-service] $*" >&2
}

find_service_arn() {
  aws apprunner list-services \
    --region "$region" \
    --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn | [0]" \
    --output text
}

describe_status() {
  local arn="$1"
  aws apprunner describe-service \
    --region "$region" \
    --service-arn "$arn" \
    --query "Service.Status" \
    --output text 2>/dev/null || echo "MISSING"
}

describe_url() {
  local arn="$1"
  aws apprunner describe-service \
    --region "$region" \
    --service-arn "$arn" \
    --query "Service.ServiceUrl" \
    --output text
}

wait_for_steady_state() {
  # Wait until the service exits any transitional state
  # (CREATING / DELETING / OPERATION_IN_PROGRESS). Returns the final status.
  local arn="$1"
  local deadline=$(($(date +%s) + settle_timeout_seconds))
  local status
  while :; do
    status="$(describe_status "$arn")"
    case "$status" in
      CREATING|DELETING|OPERATION_IN_PROGRESS|PENDING_CREATION)
        if (( $(date +%s) >= deadline )); then
          log "timed out waiting for service to exit $status"
          echo "$status"
          return 0
        fi
        log "service in transitional state $status, waiting ${poll_interval_seconds}s..."
        sleep "$poll_interval_seconds"
        ;;
      *)
        echo "$status"
        return 0
        ;;
    esac
  done
}

wait_for_running() {
  # Poll until the service is RUNNING, or until we hit a failure state
  # or the deploy timeout.
  local arn="$1"
  local deadline=$(($(date +%s) + deploy_timeout_seconds))
  local status
  while :; do
    status="$(describe_status "$arn")"
    case "$status" in
      RUNNING)
        return 0
        ;;
      CREATE_FAILED|OPERATION_FAILED|DELETE_FAILED)
        log "service entered failure state: $status"
        return 1
        ;;
      MISSING)
        log "service disappeared while waiting for RUNNING"
        return 1
        ;;
      *)
        if (( $(date +%s) >= deadline )); then
          log "timed out after ${deploy_timeout_seconds}s waiting for RUNNING (last status: $status)"
          return 1
        fi
        log "service status $status, waiting ${poll_interval_seconds}s..."
        sleep "$poll_interval_seconds"
        ;;
    esac
  done
}

delete_and_wait() {
  local arn="$1"
  log "deleting service $service_name ($arn)"
  aws apprunner delete-service \
    --region "$region" \
    --service-arn "$arn" \
    >/dev/null
  local deadline=$(($(date +%s) + delete_timeout_seconds))
  while :; do
    local status
    status="$(describe_status "$arn")"
    # App Runner keeps the service around with Status=DELETED for a short
    # window after delete completes; both DELETED and MISSING mean done.
    if [[ "$status" == "MISSING" || "$status" == "DELETED" ]]; then
      log "service deleted (status: $status)"
      return 0
    fi
    if (( $(date +%s) >= deadline )); then
      log "timed out waiting for delete (last status: $status)"
      return 1
    fi
    log "delete in progress (status: $status), waiting ${poll_interval_seconds}s..."
    sleep "$poll_interval_seconds"
  done
}

wait_for_name_available() {
  # After delete, the service name may briefly remain reserved. Poll
  # list-services until the name is gone so the next create-service call
  # doesn't hit a ServiceName conflict.
  local deadline=$(($(date +%s) + 180))
  while :; do
    local found
    found="$(find_service_arn)"
    if [[ -z "$found" || "$found" == "None" ]]; then
      return 0
    fi
    if (( $(date +%s) >= deadline )); then
      log "service name $service_name still reserved after 180s; proceeding anyway"
      return 0
    fi
    log "waiting for service name $service_name to be released..."
    sleep "$poll_interval_seconds"
  done
}

create_service() {
  log "creating service $service_name"
  aws apprunner create-service \
    --region "$region" \
    --service-name "$service_name" \
    --source-configuration "file://$tmpdir/source-configuration.json" \
    --instance-configuration 'Cpu=256,Memory=512' \
    --health-check-configuration 'Protocol=HTTP,Path=/health,HealthyThreshold=1,UnhealthyThreshold=5,Interval=10,Timeout=5' \
    --query "Service.ServiceArn" \
    --output text
}

update_service() {
  local arn="$1"
  log "updating existing service $service_name"
  aws apprunner update-service \
    --region "$region" \
    --service-arn "$arn" \
    --source-configuration "file://$tmpdir/source-configuration.json" \
    --instance-configuration 'Cpu=256,Memory=512' \
    >/dev/null
}

service_arn="$(find_service_arn)"

if [[ -n "$service_arn" && "$service_arn" != "None" ]]; then
  current_status="$(wait_for_steady_state "$service_arn")"
  log "existing service $service_name status: $current_status"

  case "$current_status" in
    RUNNING|PAUSED)
      update_service "$service_arn"
      ;;
    CREATE_FAILED|OPERATION_FAILED|DELETE_FAILED|CREATING|DELETING|OPERATION_IN_PROGRESS|PENDING_CREATION)
      # Either a terminal failure or still transitional after settle_timeout.
      # In both cases the cleanest path forward is delete + recreate.
      if ! delete_and_wait "$service_arn"; then
        log "failed to delete stuck service; aborting"
        exit 1
      fi
      wait_for_name_available
      service_arn="$(create_service)"
      ;;
    DELETED|MISSING|None|"")
      wait_for_name_available
      service_arn="$(create_service)"
      ;;
    *)
      log "unexpected status '$current_status'; attempting update"
      update_service "$service_arn"
      ;;
  esac
else
  service_arn="$(create_service)"
fi

if ! wait_for_running "$service_arn"; then
  log "service did not reach RUNNING; posting service ARN for debugging: $service_arn"
  exit 1
fi

preview_url="$(describe_url "$service_arn")"

if [[ -z "$preview_url" || "$preview_url" == "None" ]]; then
  log "preview URL missing for service $service_name despite RUNNING state"
  exit 1
fi

log "service $service_name is RUNNING at https://$preview_url"
echo "https://$preview_url"
