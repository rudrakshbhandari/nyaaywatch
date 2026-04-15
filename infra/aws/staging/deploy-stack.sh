#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <stack-name> <container-image> <operator-token> <database-password>" >&2
  echo "Example: $0 nyaaywatch-staging 123456789012.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch:latest token password" >&2
  exit 1
fi

stack_name="$1"
container_image="$2"
operator_token="$3"
database_password="$4"
region="ap-south-1"

aws cloudformation deploy \
  --region "$region" \
  --stack-name "$stack_name" \
  --template-file "infra/aws/staging/stack.yaml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ContainerImage="$container_image" \
    OperatorApiToken="$operator_token" \
    DatabasePassword="$database_password"

aws cloudformation describe-stacks \
  --region "$region" \
  --stack-name "$stack_name" \
  --query 'Stacks[0].Outputs'
