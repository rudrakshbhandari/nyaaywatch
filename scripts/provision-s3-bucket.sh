#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <bucket-name> <env>" >&2
  echo "Example: $0 nyaaywatch-dev-artifacts-723951822728 dev" >&2
  exit 1
fi

bucket_name="$1"
deploy_env="$2"
region="ap-south-1"

if [[ ! "$bucket_name" =~ ^nyaaywatch-[a-z0-9-]+$ ]]; then
  echo "Bucket name must be nyaaywatch-prefixed and lowercase." >&2
  exit 1
fi

if [[ "$deploy_env" != "dev" && "$deploy_env" != "staging" ]]; then
  echo "Environment must be dev or staging." >&2
  exit 1
fi

if aws s3api head-bucket --bucket "$bucket_name" --region "$region" >/dev/null 2>&1; then
  echo "Bucket already exists: $bucket_name"
else
  aws s3api create-bucket \
    --bucket "$bucket_name" \
    --region "$region" \
    --create-bucket-configuration "LocationConstraint=$region"
fi

aws s3api put-bucket-tagging \
  --bucket "$bucket_name" \
  --region "$region" \
  --tagging "TagSet=[{Key=project,Value=nyaaywatch},{Key=env,Value=$deploy_env}]"

echo "Provisioned $bucket_name in $region with project=nyaaywatch env=$deploy_env"
