#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 7 ]]; then
  echo "Usage: $0 <stack-name> <vpc-id> <public-subnet-ids> <private-subnet-ids> <container-image> <operator-token> <database-password>" >&2
  echo "Example: $0 nyaaywatch-staging vpc-123 subnet-a,subnet-b subnet-c,subnet-d 123456789012.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch:latest token password" >&2
  exit 1
fi

stack_name="$1"
vpc_id="$2"
public_subnet_ids="$3"
private_subnet_ids="$4"
container_image="$5"
operator_token="$6"
database_password="$7"
region="ap-south-1"

aws cloudformation deploy \
  --region "$region" \
  --stack-name "$stack_name" \
  --template-file "infra/aws/staging/stack.yaml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId="$vpc_id" \
    PublicSubnetIds="$public_subnet_ids" \
    PrivateSubnetIds="$private_subnet_ids" \
    ContainerImage="$container_image" \
    OperatorApiToken="$operator_token" \
    DatabasePassword="$database_password"

aws cloudformation describe-stacks \
  --region "$region" \
  --stack-name "$stack_name" \
  --query 'Stacks[0].Outputs'
