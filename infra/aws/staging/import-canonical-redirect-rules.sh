#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <stack-name> [change-set-name]" >&2
  echo "Example: $0 nyaaywatch-staging import-canonical-redirect-rules-20260420" >&2
  exit 1
fi

stack_name="$1"
change_set_name="${2:-import-canonical-redirect-rules-$(date -u +%Y%m%d%H%M%S)}"
region="${AWS_REGION:-ap-south-1}"

stack_has_rule() {
  local logical_id="$1"
  local count

  count=$(
    aws cloudformation describe-stack-resources \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "length(StackResources[?LogicalResourceId=='${logical_id}' && ResourceStatus!='DELETE_COMPLETE'])" \
      --output text
  )

  [[ "$count" != "0" ]]
}

if stack_has_rule "CanonicalHttpRedirectRule" && stack_has_rule "CanonicalHttpsRedirectRule"; then
  echo "Canonical redirect rules are already managed by CloudFormation for stack ${stack_name}."
  exit 0
fi

http_listener_arn=$(
  aws cloudformation describe-stack-resources \
    --region "$region" \
    --stack-name "$stack_name" \
    --logical-resource-id Listener \
    --query 'StackResources[0].PhysicalResourceId' \
    --output text
)

https_listener_arn=$(
  aws cloudformation describe-stack-resources \
    --region "$region" \
    --stack-name "$stack_name" \
    --logical-resource-id HttpsListener \
    --query 'StackResources[0].PhysicalResourceId' \
    --output text
)

http_rule_arn=$(
  aws elbv2 describe-rules \
    --region "$region" \
    --listener-arn "$http_listener_arn" \
    --query "Rules[?Priority=='10'].RuleArn | [0]" \
    --output text
)

https_rule_arn=$(
  aws elbv2 describe-rules \
    --region "$region" \
    --listener-arn "$https_listener_arn" \
    --query "Rules[?Priority=='10'].RuleArn | [0]" \
    --output text
)

if [[ -z "$http_rule_arn" || "$http_rule_arn" == "None" ]]; then
  echo "Could not find the priority-10 HTTP redirect rule on listener ${http_listener_arn}." >&2
  exit 1
fi

if [[ -z "$https_rule_arn" || "$https_rule_arn" == "None" ]]; then
  echo "Could not find the priority-10 HTTPS redirect rule on listener ${https_listener_arn}." >&2
  exit 1
fi

resources_to_import_file="$(mktemp /tmp/nyaaywatch-canonical-redirect-import.XXXXXX.json)"
trap 'rm -f "$resources_to_import_file"' EXIT

cat >"$resources_to_import_file" <<EOF
[
  {
    "ResourceType": "AWS::ElasticLoadBalancingV2::ListenerRule",
    "LogicalResourceId": "CanonicalHttpRedirectRule",
    "ResourceIdentifier": {
      "RuleArn": "${http_rule_arn}"
    }
  },
  {
    "ResourceType": "AWS::ElasticLoadBalancingV2::ListenerRule",
    "LogicalResourceId": "CanonicalHttpsRedirectRule",
    "ResourceIdentifier": {
      "RuleArn": "${https_rule_arn}"
    }
  }
]
EOF

aws cloudformation create-change-set \
  --region "$region" \
  --stack-name "$stack_name" \
  --change-set-name "$change_set_name" \
  --change-set-type IMPORT \
  --template-body file://infra/aws/staging/stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --resources-to-import "file://${resources_to_import_file}" \
  --parameters \
    ParameterKey=ContainerImage,UsePreviousValue=true \
    ParameterKey=OperatorApiToken,UsePreviousValue=true \
    ParameterKey=DatabasePassword,UsePreviousValue=true \
    ParameterKey=CertificateArn,UsePreviousValue=true \
    ParameterKey=AlarmEmail,UsePreviousValue=true \
    ParameterKey=PublicBaseUrl,UsePreviousValue=true \
    ParameterKey=CloudflareZoneName,UsePreviousValue=true \
    ParameterKey=CloudflareApiTokenSecretArn,UsePreviousValue=true \
    ParameterKey=ExistingDatabaseUrlSecretArn,UsePreviousValue=true \
    ParameterKey=ExistingOperatorApiTokenSecretArn,UsePreviousValue=true \
    ParameterKey=ProjectName,UsePreviousValue=true \
    ParameterKey=EnvironmentName,UsePreviousValue=true \
    ParameterKey=DatabaseName,UsePreviousValue=true \
    ParameterKey=DatabaseUsername,UsePreviousValue=true \
    ParameterKey=DesiredCount,UsePreviousValue=true \
    ParameterKey=ContainerPort,UsePreviousValue=true \
    ParameterKey=ManageCanonicalRedirectRules,ParameterValue=true

if ! aws cloudformation wait change-set-create-complete \
  --region "$region" \
  --stack-name "$stack_name" \
  --change-set-name "$change_set_name"; then
  aws cloudformation describe-change-set \
    --region "$region" \
    --stack-name "$stack_name" \
    --change-set-name "$change_set_name" \
    --query '{Status:Status,ExecutionStatus:ExecutionStatus,StatusReason:StatusReason}' \
    --output json >&2
  exit 1
fi

aws cloudformation describe-change-set \
  --region "$region" \
  --stack-name "$stack_name" \
  --change-set-name "$change_set_name" \
  --query 'Changes[].ResourceChange.[Action,LogicalResourceId,ResourceType,Replacement]' \
  --output table

aws cloudformation execute-change-set \
  --region "$region" \
  --stack-name "$stack_name" \
  --change-set-name "$change_set_name"

aws cloudformation wait stack-import-complete \
  --region "$region" \
  --stack-name "$stack_name"

aws cloudformation describe-stacks \
  --region "$region" \
  --stack-name "$stack_name" \
  --query 'Stacks[0].Parameters[?ParameterKey==`ManageCanonicalRedirectRules`].ParameterValue | [0]' \
  --output text
