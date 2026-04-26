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
project_name="${PROJECT_NAME:-nyaaywatch}"
environment_name="${ENVIRONMENT_NAME:-staging}"
canonical_host="${CANONICAL_HOST:-nyaaywatch.in}"
legacy_hosts="${LEGACY_HOSTS:-nyaaywatch.com,www.nyaaywatch.com}"
manage_canonical_redirect_rules="${MANAGE_CANONICAL_REDIRECT_RULES:-}"

is_legacy_production_stack=false
if [[ "$stack_name" == "nyaaywatch-staging" && "$project_name" == "nyaaywatch" && "$environment_name" == "staging" ]]; then
  is_legacy_production_stack=true
fi

if [[ "$environment_name" != "staging" && "$environment_name" != "production" ]]; then
  echo "ENVIRONMENT_NAME must be staging or production for the AWS stack template." >&2
  exit 1
fi

if [[ "$stack_name" != "nyaaywatch-staging" && "$project_name" == "nyaaywatch" && "$environment_name" == "staging" ]]; then
  echo "Refusing to deploy a second stack with ProjectName=nyaaywatch and EnvironmentName=staging because those names collide with the current production-serving nyaaywatch-staging resources." >&2
  echo "Use a distinct PROJECT_NAME for an isolated staging rehearsal stack, or use ENVIRONMENT_NAME=production for a reality-named production replacement." >&2
  exit 1
fi

if [[ "$environment_name" == "production" && "$stack_name" != *production* ]]; then
  echo "Refusing to deploy ENVIRONMENT_NAME=production to a stack name that does not include 'production'." >&2
  exit 1
fi

if [[ -z "$manage_canonical_redirect_rules" ]]; then
  if [[ "$environment_name" == "production" || "$is_legacy_production_stack" == "true" ]]; then
    manage_canonical_redirect_rules="true"
  else
    manage_canonical_redirect_rules="false"
  fi
fi

if [[ "$environment_name" != "production" && "$is_legacy_production_stack" != "true" ]]; then
  if [[ "$canonical_host" == "nyaaywatch.in" || "${PUBLIC_BASE_URL:-}" == "https://nyaaywatch.in" || "${PUBLIC_BASE_URL:-}" == "http://nyaaywatch.in" ]]; then
    echo "Refusing to deploy a non-production stack with the production hostname or PUBLIC_BASE_URL." >&2
    exit 1
  fi

  if [[ "$manage_canonical_redirect_rules" == "true" ]]; then
    echo "Refusing to manage canonical production redirect rules from a non-production stack." >&2
    exit 1
  fi

  if [[ -n "${CLOUDFLARE_API_TOKEN_SECRET_ARN:-}" && -z "${PUBLIC_BASE_URL:-}" ]]; then
    echo "Refusing to attach a Cloudflare purge token to a non-production stack without an explicit non-production PUBLIC_BASE_URL." >&2
    exit 1
  fi
fi

deploy_args=(
  aws cloudformation deploy
  --region "$region"
  --stack-name "$stack_name"
  --template-file "infra/aws/staging/stack.yaml"
  --capabilities CAPABILITY_NAMED_IAM
  --parameter-overrides
    ProjectName="$project_name"
    EnvironmentName="$environment_name"
    ContainerImage="$container_image"
    OperatorApiToken="$operator_token"
    DatabasePassword="$database_password"
    CertificateArn="$certificate_arn"
    CanonicalHost="$canonical_host"
    LegacyHosts="$legacy_hosts"
    ManageCanonicalRedirectRules="$manage_canonical_redirect_rules"
)

if [[ -n "${PUBLIC_BASE_URL:-}" ]]; then
  deploy_args+=(PublicBaseUrl="$PUBLIC_BASE_URL")
fi

if [[ -n "${CLOUDFLARE_ZONE_NAME:-}" ]]; then
  deploy_args+=(CloudflareZoneName="$CLOUDFLARE_ZONE_NAME")
fi

if [[ -n "${CLOUDFLARE_API_TOKEN_SECRET_ARN:-}" ]]; then
  deploy_args+=(CloudflareApiTokenSecretArn="$CLOUDFLARE_API_TOKEN_SECRET_ARN")
fi

if [[ -n "${EXISTING_DATABASE_URL_SECRET_ARN:-}" ]]; then
  deploy_args+=(ExistingDatabaseUrlSecretArn="$EXISTING_DATABASE_URL_SECRET_ARN")
fi

if [[ -n "${EXISTING_OPERATOR_API_TOKEN_SECRET_ARN:-}" ]]; then
  deploy_args+=(ExistingOperatorApiTokenSecretArn="$EXISTING_OPERATOR_API_TOKEN_SECRET_ARN")
fi

if [[ -n "$alarm_email" ]]; then
  deploy_args+=(AlarmEmail="$alarm_email")
fi

"${deploy_args[@]}"

aws cloudformation describe-stacks \
  --region "$region" \
  --stack-name "$stack_name" \
  --query 'Stacks[0].Outputs'
