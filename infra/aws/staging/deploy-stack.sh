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
database_name="${STACK_DATABASE_NAME:-nyaaywatch}"
database_username="${STACK_DATABASE_USERNAME:-nyaaywatch}"
database_allocated_storage="${STACK_DATABASE_ALLOCATED_STORAGE:-20}"
database_name_explicit=false
database_username_explicit=false
database_allocated_storage_explicit=false
canonical_host="${CANONICAL_HOST:-nyaaywatch.in}"
legacy_hosts="${LEGACY_HOSTS:-}"
manage_canonical_redirect_rules="${MANAGE_CANONICAL_REDIRECT_RULES:-}"
legacy_production_stack="${LEGACY_PRODUCTION_STACK:-false}"
reclaimed_staging_name="${RECLAIMED_STAGING_NAME:-false}"
database_snapshot_identifier="${DATABASE_SNAPSHOT_IDENTIFIER:-}"
database_snapshot_identifier_explicit=false
allow_database_snapshot_replacement="${ALLOW_DATABASE_SNAPSHOT_REPLACEMENT:-false}"
allow_snapshot_database_identity_change="${ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE:-false}"
snapshot_database_password_confirmed="${SNAPSHOT_DATABASE_PASSWORD_CONFIRMED:-false}"

if [[ -n "$database_snapshot_identifier" ]]; then
  database_snapshot_identifier_explicit=true
fi

if [[ -n "${STACK_DATABASE_NAME:-}" ]]; then
  database_name_explicit=true
fi

if [[ -n "${STACK_DATABASE_USERNAME:-}" ]]; then
  database_username_explicit=true
fi

if [[ -n "${STACK_DATABASE_ALLOCATED_STORAGE:-}" ]]; then
  database_allocated_storage_explicit=true
fi

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
  if [[ "$url" =~ ^https?://([^/?#]+) ]]; then
    local authority="${BASH_REMATCH[1]}"
    authority="${authority##*@}"
    authority="${authority%%:*}"
    normalize_host "$authority"
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

if [[ "$allow_database_snapshot_replacement" != "true" && "$allow_database_snapshot_replacement" != "false" ]]; then
  echo "ALLOW_DATABASE_SNAPSHOT_REPLACEMENT must be true or false." >&2
  exit 1
fi

if [[ "$allow_snapshot_database_identity_change" != "true" && "$allow_snapshot_database_identity_change" != "false" ]]; then
  echo "ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE must be true or false." >&2
  exit 1
fi

if [[ "$snapshot_database_password_confirmed" != "true" && "$snapshot_database_password_confirmed" != "false" ]]; then
  echo "SNAPSHOT_DATABASE_PASSWORD_CONFIRMED must be true or false." >&2
  exit 1
fi

if ! [[ "$database_allocated_storage" =~ ^[0-9]+$ ]]; then
  echo "STACK_DATABASE_ALLOCATED_STORAGE must be a positive integer when set." >&2
  exit 1
fi

if (( database_allocated_storage < 20 )); then
  echo "STACK_DATABASE_ALLOCATED_STORAGE must be at least 20 GiB." >&2
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

if [[ -n "$database_snapshot_identifier" && -n "${EXISTING_DATABASE_URL_SECRET_ARN:-}" ]]; then
  echo "DATABASE_SNAPSHOT_IDENTIFIER cannot be combined with EXISTING_DATABASE_URL_SECRET_ARN." >&2
  echo "Snapshot bootstrap creates an isolated managed database and generated DATABASE_URL secret; the shared-database bridge must not be mixed into that path." >&2
  exit 1
fi

stack_exists=false
previous_database_snapshot_identifier="$(
  aws cloudformation describe-stacks \
    --region "$region" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Parameters[?ParameterKey=='DatabaseSnapshotIdentifier'].ParameterValue | [0]" \
    --output text \
    2>&1
)" && stack_exists=true || {
  if [[ "$previous_database_snapshot_identifier" == *"does not exist"* ]]; then
    previous_database_snapshot_identifier=""
  else
    echo "Could not inspect existing CloudFormation parameters for stack $stack_name." >&2
    echo "$previous_database_snapshot_identifier" >&2
    exit 1
  fi
}

if [[ "$previous_database_snapshot_identifier" == "None" ]]; then
  previous_database_snapshot_identifier=""
fi

if [[ "$stack_exists" == "true" ]]; then
  previous_database_name="$(
    aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].Parameters[?ParameterKey=='DatabaseName'].ParameterValue | [0]" \
      --output text
  )"
  previous_database_username="$(
    aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].Parameters[?ParameterKey=='DatabaseUsername'].ParameterValue | [0]" \
      --output text
  )"
  previous_database_allocated_storage="$(
    aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].Parameters[?ParameterKey=='DatabaseAllocatedStorage'].ParameterValue | [0]" \
      --output text
  )"
  previous_existing_database_url_secret_arn="$(
    aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].Parameters[?ParameterKey=='ExistingDatabaseUrlSecretArn'].ParameterValue | [0]" \
      --output text
  )"

  if [[ "$previous_database_name" == "None" ]]; then
    previous_database_name=""
  fi

  if [[ "$previous_database_username" == "None" ]]; then
    previous_database_username=""
  fi

  if [[ "$previous_database_allocated_storage" == "None" ]]; then
    previous_database_allocated_storage=""
  fi

  if [[ "$previous_existing_database_url_secret_arn" == "None" ]]; then
    previous_existing_database_url_secret_arn=""
  fi
else
  previous_database_name=""
  previous_database_username=""
  previous_database_allocated_storage=""
  previous_existing_database_url_secret_arn=""
fi

if [[ -n "$previous_database_snapshot_identifier" ]]; then
  if [[ -z "$database_snapshot_identifier" ]]; then
    database_snapshot_identifier="$previous_database_snapshot_identifier"
    echo "Preserving existing DatabaseSnapshotIdentifier for $stack_name: $database_snapshot_identifier"
  elif [[ "$database_snapshot_identifier" != "$previous_database_snapshot_identifier" && "$allow_database_snapshot_replacement" != "true" ]]; then
    echo "Refusing to change DatabaseSnapshotIdentifier for $stack_name from '$previous_database_snapshot_identifier' to '$database_snapshot_identifier'." >&2
    echo "Changing it can replace the managed RDS instance. Set ALLOW_DATABASE_SNAPSHOT_REPLACEMENT=true only for a deliberate database replacement." >&2
    exit 1
  fi

  if [[ "$database_name_explicit" != "true" && -n "$previous_database_name" ]]; then
    database_name="$previous_database_name"
    echo "Preserving existing DatabaseName for snapshot-backed stack $stack_name: $database_name"
  elif [[ "$database_name_explicit" == "true" && -n "$previous_database_name" && "$database_name" != "$previous_database_name" && "$allow_snapshot_database_identity_change" != "true" ]]; then
    echo "Refusing to change DatabaseName for snapshot-backed stack $stack_name from '$previous_database_name' to '$database_name'." >&2
    echo "Changing it rewrites the generated DATABASE_URL identity. Set ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE=true only with a matching restored database." >&2
    exit 1
  fi

  if [[ "$database_username_explicit" != "true" && -n "$previous_database_username" ]]; then
    database_username="$previous_database_username"
    echo "Preserving existing DatabaseUsername for snapshot-backed stack $stack_name: $database_username"
  elif [[ "$database_username_explicit" == "true" && -n "$previous_database_username" && "$database_username" != "$previous_database_username" && "$allow_snapshot_database_identity_change" != "true" ]]; then
    echo "Refusing to change DatabaseUsername for snapshot-backed stack $stack_name from '$previous_database_username' to '$database_username'." >&2
    echo "Changing it rewrites the generated DATABASE_URL identity. Set ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE=true only with a matching restored database." >&2
    exit 1
  fi

  if [[ "$database_allocated_storage_explicit" != "true" && -n "$previous_database_allocated_storage" ]]; then
    database_allocated_storage="$previous_database_allocated_storage"
    echo "Preserving existing DatabaseAllocatedStorage for snapshot-backed stack $stack_name: $database_allocated_storage"
  fi
elif [[ "$stack_exists" == "true" && -n "$database_snapshot_identifier" && "$allow_database_snapshot_replacement" != "true" ]]; then
  echo "Refusing to add DatabaseSnapshotIdentifier to existing stack $stack_name without explicit replacement approval." >&2
  echo "Adding it to an existing managed RDS stack can replace the database. Set ALLOW_DATABASE_SNAPSHOT_REPLACEMENT=true only for a deliberate database replacement." >&2
  exit 1
fi

if [[ -n "$database_snapshot_identifier" && ( -n "${EXISTING_DATABASE_URL_SECRET_ARN:-}" || -n "$previous_existing_database_url_secret_arn" ) ]]; then
  echo "DATABASE_SNAPSHOT_IDENTIFIER cannot be combined with EXISTING_DATABASE_URL_SECRET_ARN." >&2
  echo "Snapshot bootstrap creates an isolated managed database and generated DATABASE_URL secret; the shared-database bridge must not be mixed into that path." >&2
  exit 1
fi

if [[ -n "$database_snapshot_identifier" ]]; then
  if [[ "$snapshot_database_password_confirmed" != "true" ]]; then
    echo "SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true is required when DATABASE_SNAPSHOT_IDENTIFIER is set." >&2
    echo "For snapshot restores, CloudFormation does not set the RDS password; the deploy password argument only writes the generated DATABASE_URL secret and must already match the restored database." >&2
    exit 1
  fi

  if [[ "$database_snapshot_identifier_explicit" == "true" ]]; then
    snapshot_identity="$(
      aws rds describe-db-snapshots \
        --region "$region" \
        --db-snapshot-identifier "$database_snapshot_identifier" \
        --query "DBSnapshots[0].[DBName,MasterUsername,AllocatedStorage,DBInstanceIdentifier,DbiResourceId]" \
        --output text
    )"
    read -r snapshot_database_name snapshot_database_username snapshot_allocated_storage snapshot_source_db_instance_identifier snapshot_source_dbi_resource_id <<< "$snapshot_identity"

    if [[ "$snapshot_database_name" == "None" ]]; then
      snapshot_database_name=""
    fi

    if [[ "$snapshot_source_db_instance_identifier" == "None" ]]; then
      snapshot_source_db_instance_identifier=""
    fi

    if [[ "$snapshot_source_dbi_resource_id" == "None" ]]; then
      snapshot_source_dbi_resource_id=""
    fi

    if [[ "$snapshot_database_username" == "None" ]]; then
      snapshot_database_username=""
    fi

    if [[ "$snapshot_allocated_storage" == "None" ]]; then
      snapshot_allocated_storage=""
    fi

    if [[ -z "$snapshot_database_name" && -n "$snapshot_source_db_instance_identifier" ]]; then
      if [[ -z "$snapshot_source_dbi_resource_id" ]]; then
        echo "Snapshot '$database_snapshot_identifier' did not expose DBName or source DbiResourceId." >&2
        echo "Refusing to use mutable DB instance identifier fallback for DBName without immutable lineage." >&2
        exit 1
      fi

      if snapshot_source_database_identity="$(
        aws rds describe-db-instances \
          --region "$region" \
          --db-instance-identifier "$snapshot_source_db_instance_identifier" \
          --query "DBInstances[0].[DBName,DbiResourceId]" \
          --output text \
          2>/dev/null
      )"; then
        read -r snapshot_source_database_name snapshot_current_dbi_resource_id <<< "$snapshot_source_database_identity"

        if [[ "$snapshot_source_database_name" == "None" ]]; then
          snapshot_source_database_name=""
        fi

        if [[ "$snapshot_current_dbi_resource_id" == "None" ]]; then
          snapshot_current_dbi_resource_id=""
        fi

        if [[ -n "$snapshot_source_dbi_resource_id" && "$snapshot_source_dbi_resource_id" != "$snapshot_current_dbi_resource_id" ]]; then
          echo "Snapshot source DB instance identifier '$snapshot_source_db_instance_identifier' now points to DbiResourceId '$snapshot_current_dbi_resource_id', but snapshot '$database_snapshot_identifier' came from DbiResourceId '$snapshot_source_dbi_resource_id'." >&2
          echo "Refusing to use mutable DB instance identifier fallback for DBName." >&2
          exit 1
        fi

        if [[ -n "$snapshot_source_database_name" ]]; then
          snapshot_database_name="$snapshot_source_database_name"
        fi
      fi
    fi

    if [[ -z "$snapshot_database_name" || -z "$snapshot_database_username" ]]; then
      echo "Could not verify DB name and master username for snapshot '$database_snapshot_identifier'." >&2
      if [[ -z "$snapshot_database_name" && -n "$snapshot_source_db_instance_identifier" ]]; then
        echo "The snapshot did not expose DBName, and source DB instance '$snapshot_source_db_instance_identifier' could not be used as a fallback." >&2
      fi
      echo "Refusing to generate a DATABASE_URL secret for an unverified snapshot identity." >&2
      exit 1
    fi

    if [[ "$snapshot_database_name" != "$database_name" ]]; then
      echo "Snapshot DB name '$snapshot_database_name' does not match STACK_DATABASE_NAME='$database_name'." >&2
      echo "Set STACK_DATABASE_NAME to the snapshot DB name so the generated DATABASE_URL secret is correct, or use a matching snapshot." >&2
      exit 1
    fi

    if [[ "$snapshot_database_username" != "$database_username" ]]; then
      echo "Snapshot master username '$snapshot_database_username' does not match STACK_DATABASE_USERNAME='$database_username'." >&2
      echo "Set STACK_DATABASE_USERNAME to the snapshot master username so the generated DATABASE_URL secret is correct, or use a matching snapshot." >&2
      exit 1
    fi

    if [[ -n "$snapshot_allocated_storage" && "$snapshot_allocated_storage" =~ ^[0-9]+$ && "$database_allocated_storage" =~ ^[0-9]+$ ]]; then
      if (( database_allocated_storage < snapshot_allocated_storage )); then
        echo "STACK_DATABASE_ALLOCATED_STORAGE='$database_allocated_storage' is smaller than snapshot allocated storage '$snapshot_allocated_storage'." >&2
        echo "Set STACK_DATABASE_ALLOCATED_STORAGE to at least the snapshot size before restoring." >&2
        exit 1
      fi
    fi
  fi
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

if [[ "$canonical_host" == *:* ]]; then
  echo "CANONICAL_HOST must be a hostname without a port." >&2
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

if [[ "$database_name_explicit" == "true" || -n "$database_snapshot_identifier" ]]; then
  deploy_args+=(DatabaseName="$database_name")
fi

if [[ "$database_username_explicit" == "true" || -n "$database_snapshot_identifier" ]]; then
  deploy_args+=(DatabaseUsername="$database_username")
fi

if [[ "$database_allocated_storage_explicit" == "true" || -n "$database_snapshot_identifier" ]]; then
  deploy_args+=(DatabaseAllocatedStorage="$database_allocated_storage")
fi

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

if [[ -n "$database_snapshot_identifier" ]]; then
  deploy_args+=(DatabaseSnapshotIdentifier="$database_snapshot_identifier")
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
