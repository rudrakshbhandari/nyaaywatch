#!/usr/bin/env bash

apprunner_find_service_arn_by_name() {
  local region="$1"
  local service_name="$2"
  local next_token=""

  while :; do
    local args=(apprunner list-services --region "$region")
    if [[ -n "$next_token" ]]; then
      args+=(--next-token "$next_token")
    fi

    local service_arn
    service_arn="$(
      aws "${args[@]}" \
        --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn | [0]" \
        --output text
    )"

    if [[ -n "$service_arn" && "$service_arn" != "None" ]]; then
      echo "$service_arn"
      return 0
    fi

    next_token="$(aws "${args[@]}" --query "NextToken" --output text)"
    if [[ -z "$next_token" || "$next_token" == "None" ]]; then
      return 0
    fi
  done
}

apprunner_list_service_names_by_prefix() {
  local region="$1"
  local service_prefix="$2"
  local next_token=""

  while :; do
    local args=(apprunner list-services --region "$region")
    if [[ -n "$next_token" ]]; then
      args+=(--next-token "$next_token")
    fi

    local page_names
    page_names="$(
      aws "${args[@]}" \
        --query "ServiceSummaryList[?starts_with(ServiceName, '${service_prefix}')].ServiceName" \
        --output text |
        tr '\t' '\n' |
        sed '/^$/d;/^None$/d'
    )"

    if [[ -n "$page_names" ]]; then
      printf '%s\n' "$page_names"
    fi

    next_token="$(aws "${args[@]}" --query "NextToken" --output text)"
    if [[ -z "$next_token" || "$next_token" == "None" ]]; then
      return 0
    fi
  done
}
