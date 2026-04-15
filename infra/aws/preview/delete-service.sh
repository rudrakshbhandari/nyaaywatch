#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <service-name>" >&2
  echo "Example: $0 nyaaywatch-pr-21" >&2
  exit 1
fi

service_name="$1"
region="${AWS_REGION:-ap-south-1}"

service_arn="$(
  aws apprunner list-services \
    --region "$region" \
    --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn | [0]" \
    --output text
)"

if [[ -z "$service_arn" || "$service_arn" == "None" ]]; then
  echo "Service $service_name already absent."
  exit 0
fi

aws apprunner delete-service \
  --region "$region" \
  --service-arn "$service_arn" \
  >/dev/null

echo "Deleted $service_name"
