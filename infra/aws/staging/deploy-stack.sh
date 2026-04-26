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
legacy_hosts="${LEGACY_HOSTS:-}"
manage_canonical_redirect_rules="${MANAGE_CANONICAL_REDIRECT_RULES:-}"
legacy_production_stack="${LEGACY_PRODUCTION_STACK:-false}"
reclaimed_staging_name="${RECLAIMED_STAGING_NAME:-false}"

normalize_host() {
  local host="$1"
  host="${host//[[:space:]]/}"
  host="$(printf "%s" "$host" | tr "[:upper:]" "[:lower:]")"
  while [[ "$host" == *. ]]; do
    host="${host%.}"
  done
  printf "%s" "$host"
}

url_host() {
  local url="$1"
  if [[ "$url" =~ ^https?://([^/:?#]+) ]]; then
    normalize_host "${BASH_REMATCH[1]}"
  fi
}

is_production_host() {
  case "$1" in
    nyaaywatch.in | www.nyaaywatch.in | nyaaywatch.com | www.nyaaywatch.com)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

legacy_hosts_include_production_host() {
  local host
  IFS="," read -ra hosts <<< "$legacy_hosts"
  for host in "${hosts[@]}"; do
    host="$(normalize_host "$host")"
    if is_production_host "$host"; then
      return 0
    fi
  done

  return 1
}

is_legacy_production_stack=false
if [[ "$legacy_production_stack" == "true" ]]; then
  is_legacy_production_stack=true
fi

if [[ "$environment_name" != "staging" && "$environment_name" != "production" ]]; then
  echo "ENVIRONMENT_NAME must be staging or production for the AWS stack template." >&2
  exit 1
fi

if [[ "$legacy_production_stack" != "true" && "$legacy_production_stack" != "false" ]]; then
  echo "LEGACY_PRODUCTION_STACK must be true or false." >&2
  exit 1
fi

if [[ "$reclaimed_staging_name" != "true" && "$reclaimed_staging_name" != "false" ]]; then
  echo "RECLAIMED_STAGING_NAME must be true or false." >&2
  exit 1
fi

if [[ "$is_legacy_production_stack" == "true" ]]; then
  if [[ "$stack_name" != "nyaaywatch-staging" || "$project_name" != "nyaaywatch" || "$environment_name" != "staging" ]]; then
    echo "LEGACY_PRODUCTION_STACK=true is only valid for the current production-serving nyaaywatch-staging stack." >&2
    exit 1
  fi
fi

if [[ "$stack_name" == "nyaaywatch-staging" && "$project_name" == "nyaaywatch" && "$environment_name" == "staging" && "$is_legacy_production_stack" != "true" && "$reclaimed_staging_name" != "true" ]]; then
  echo "Refusing to deploy to nyaaywatch-staging without an explicit legacy-production or reclaimed-staging flag." >&2
  echo "Use LEGACY_PRODUCTION_STACK=true for the current production-serving stack, or RECLAIMED_STAGING_NAME=true only after production has been cut over to nyaaywatch-production." >&2
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

if [[ -z "$legacy_hosts" && ( "$environment_name" == "production" || "$is_legacy_production_stack" == "true" ) ]]; then
  legacy_hosts="nyaaywatch.com,www.nyaaywatch.com"
fi

if [[ "$canonical_host" == http://* || "$canonical_host" == https://* || "$canonical_host" == */* ]]; then
  echo "CANONICAL_HOST must be a hostname, not a URL." >&2
  exit 1
fi

canonical_host="$(normalize_host "$canonical_host")"
if [[ -z "$canonical_host" ]]; then
  echo "CANONICAL_HOST must be a hostname, not an empty value." >&2
  exit 1
fi

public_base_url_host="$(url_host "${PUBLIC_BASE_URL:-}")"
if [[ -n "${PUBLIC_BASE_URL:-}" && -z "$public_base_url_host" ]]; then
  echo "PUBLIC_BASE_URL must be an http(s) URL." >&2
  exit 1
fi

if [[ "$environment_name" != "production" && "$is_legacy_production_stack" != "true" ]]; then
  if is_production_host "$canonical_host" || is_production_host "$public_base_url_host"; then
    echo "Refusing to deploy a non-production stack with the production hostname or PUBLIC_BASE_URL." >&2
    exit 1
  fi

  if [[ -n "$legacy_hosts" ]] && legacy_hosts_include_production_host; then
    echo "Refusing to deploy a non-production stack with production hostnames in LEGACY_HOSTS." >&2
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
