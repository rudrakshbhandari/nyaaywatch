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

service_arn="$(
  aws apprunner list-services \
    --region "$region" \
    --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn | [0]" \
    --output text
)"

if [[ -z "$service_arn" || "$service_arn" == "None" ]]; then
  service_arn="$(
    aws apprunner create-service \
      --region "$region" \
      --service-name "$service_name" \
      --source-configuration "file://$tmpdir/source-configuration.json" \
      --instance-configuration 'Cpu=256,Memory=512' \
      --health-check-configuration 'Protocol=HTTP,Path=/health,HealthyThreshold=1,UnhealthyThreshold=5,Interval=10,Timeout=5' \
      --query "Service.ServiceArn" \
      --output text
  )"
else
  aws apprunner update-service \
    --region "$region" \
    --service-arn "$service_arn" \
    --source-configuration "file://$tmpdir/source-configuration.json" \
    --instance-configuration 'Cpu=256,Memory=512' \
    >/dev/null
fi

for _ in {1..60}; do
  status="$(
    aws apprunner describe-service \
      --region "$region" \
      --service-arn "$service_arn" \
      --query "Service.Status" \
      --output text
  )"

  case "$status" in
    RUNNING)
      break
      ;;
    CREATE_FAILED|DELETE_FAILED|OPERATION_FAILED)
      echo "App Runner service $service_name entered failure state: $status" >&2
      exit 1
      ;;
  esac

  sleep 10
done

preview_url="$(
  aws apprunner describe-service \
    --region "$region" \
    --service-arn "$service_arn" \
    --query "Service.ServiceUrl" \
    --output text
)"

if [[ -z "$preview_url" || "$preview_url" == "None" ]]; then
  echo "Preview URL missing for service $service_name" >&2
  exit 1
fi

for _ in {1..12}; do
  if curl --fail --silent --show-error "https://$preview_url/health" >/dev/null; then
    echo "https://$preview_url"
    exit 0
  fi
  sleep 10
done

echo "App Runner service $service_name reached RUNNING but /health never returned success." >&2
exit 1
