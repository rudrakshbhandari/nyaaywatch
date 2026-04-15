#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 5 || $# -gt 6 ]]; then
  echo "Usage: $0 <stack-name> <container-image> <operator-token> <database-password> <certificate-arn> [alarm-email]" >&2
  echo "Example: $0 nyaaywatch-staging 123456789012.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch:latest token password arn:aws:acm:... ops@example.com" >&2
  exit 1
fi

stack_name="$1"
container_image="$2"
operator_token="$3"
database_password="$4"
certificate_arn="$5"
alarm_email="${6:-}"
region="ap-south-1"

deploy_args=(
  aws cloudformation deploy
  --region "$region"
  --stack-name "$stack_name"
  --template-file "infra/aws/staging/stack.yaml"
  --capabilities CAPABILITY_NAMED_IAM
  --parameter-overrides
    ContainerImage="$container_image"
    OperatorApiToken="$operator_token"
    DatabasePassword="$database_password"
    CertificateArn="$certificate_arn"
)

if [[ -n "$alarm_email" ]]; then
  deploy_args+=(AlarmEmail="$alarm_email")
fi

"${deploy_args[@]}"

aws cloudformation describe-stacks \
  --region "$region" \
  --stack-name "$stack_name" \
  --query 'Stacks[0].Outputs'
