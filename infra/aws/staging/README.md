# AWS Staging Stack

This directory defines the AWS ECS/PostgreSQL/S3 stack shape first created for NyaayWatch staging:

- one ECS Fargate service running the application container
- one PostgreSQL RDS instance as the canonical store
- one `nyaaywatch-` prefixed S3 bucket for raw and normalized artifacts
- CloudWatch Logs for structured application logging
- CloudWatch alarms for health-check failure, ALB target 5xx responses, and structured app errors
- one CloudWatch dashboard for release-time operational review
- an operator validation flow that exercises fetch, inspect, publish, replay, and rollback against the target environment

## Current Naming Caveat

The production public alpha at `https://nyaaywatch.in` runs on `nyaaywatch-production`. The dedicated `nyaaywatch-staging` stack was deleted on `2026-07-09` for alpha cost; recreate it only for a real AWS rehearsal. Cloudflare `staging.nyaaywatch.in` CNAME was removed `2026-07-12` with the staging retirement cleanup.

The target environment split is:

- `local`: local Node, PostgreSQL, and LocalStack S3
- `preview`: fixture-backed App Runner PR previews with `APP_MODE=preview`
- `staging`: optional isolated AWS stack named `nyaaywatch-staging` for release and operator-flow rehearsal (currently absent)
- `production`: `https://nyaaywatch.in`, stack name `nyaaywatch-production`

Do not run sandbox experiments against the live production stack.

## Production Cutover Preflight

Run the read-only preflight only when auditing or repeating the completed parallel production cutover:

```bash
npm run infra:production-preflight
```

The helper checks a source/legacy stack is in a stable terminal CloudFormation status, checks its required outputs, confirms whether the target production stack already exists, and verifies `https://nyaaywatch.in/health`. It does not deploy CloudFormation, update ECS, change DNS, rename resources, or modify schedules.

Useful overrides:

```bash
AWS_REGION=ap-south-1 \
PUBLIC_BASE_URL=https://nyaaywatch.in \
npm run infra:production-preflight -- nyaaywatch-staging nyaaywatch-production
```

If `nyaaywatch-production` already exists, the preflight requires a stable terminal stack status and the same required output interface before it exits non-zero unless `ALLOW_EXISTING_TARGET_STACK=true` is set after manual review. That prevents an accidental cutover against an old or partial target stack.

After preflight, collect the read-only cutover inventory:

```bash
npm run infra:production-cutover-inventory
```

Use that output with `docs/PRODUCTION_CUTOVER_RUNBOOK.md` only for cutover audits, rollback review, or a future replacement-stack migration.

## Resources

The staging stack template provisions:

- S3 bucket tagged `project=nyaaywatch env=staging`
- CloudWatch log group `/ecs/nyaaywatch-staging`
- SNS topic for alarm fan-out
- AWS Budget `${ProjectName}-${EnvironmentName}-monthly-cost`, scoped to costs tagged `project=${ProjectName}` and `env=${EnvironmentName}`
- CloudWatch dashboard `nyaaywatch-staging`
- ECS cluster, task definition, and Fargate service
- public Application Load Balancer
- HTTPS listener with an ACM certificate
- PostgreSQL RDS instance in private subnets
- IAM roles granting the task access to the staging bucket and CloudWatch logs

Template file:

```bash
infra/aws/staging/stack.yaml
```

Deployment helper:

```bash
infra/aws/staging/deploy-stack.sh
```

Image build helper:

```bash
infra/aws/staging/build-and-push.sh
```

ECS service rollout helper:

```bash
infra/aws/staging/redeploy-service.sh
```

Canonical redirect-rule import helper:

```bash
infra/aws/staging/import-canonical-redirect-rules.sh
```

## Required Inputs

You need:

- an ECR image URI for the app container
- a strong database password
- an operator API token for the target environment
- an ACM certificate ARN for every public hostname the ALB must terminate, including `nyaaywatch.in`, `www.nyaaywatch.in`, `nyaaywatch.com`, and `www.nyaaywatch.com` if `.com -> .in` canonical redirects are enabled

Optional:

- an alarm email address to subscribe to the staging SNS topic
- `PUBLIC_BASE_URL` if the runtime should emit stable public URLs for release verification and cache invalidation
- `CLOUDFLARE_ZONE_NAME` if the runtime should resolve the Cloudflare zone by name
- `CLOUDFLARE_API_TOKEN_SECRET_ARN` if publish / rollback should purge Cloudflare cache without storing the token in plaintext task-definition environment variables
- `DATABASE_SNAPSHOT_IDENTIFIER` if the target managed RDS instance should be restored from an existing manual DB snapshot instead of starting empty
- `SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true` with `DATABASE_SNAPSHOT_IDENTIFIER` after verifying the deploy password argument matches the restored database password
- `STACK_DATABASE_NAME` and `STACK_DATABASE_USERNAME` only if they need to match a non-default snapshot identity; defaults are `nyaaywatch`
- `STACK_DATABASE_ALLOCATED_STORAGE` if the target RDS instance needs more than the default `20` GiB, and always for snapshot restores when the source snapshot is larger than `20` GiB
- `EXISTING_DATABASE_URL_SECRET_ARN` if an existing stack should reference a pre-created `DATABASE_URL` secret instead of creating a new one
- `EXISTING_OPERATOR_API_TOKEN_SECRET_ARN` if an existing stack should reference a pre-created operator-token secret instead of creating a new one
- `MANAGE_CANONICAL_REDIRECT_RULES=false` only as a temporary reconciliation escape hatch if an older stack already has unmanaged `.com -> .in` listener rules; the intended steady state is to import those rules so CloudFormation owns them too

The stack creates its own isolated VPC with:

- two public subnets for the ALB and ECS tasks
- two private subnets for PostgreSQL
- an internet gateway

Application config constraints to preserve during staging validation:

- `EnvironmentName` should reflect the target environment: `production` for the reality-named production stack and `staging` for the isolated staging stack.
- `ProjectName` must stay `nyaaywatch`-prefixed so the derived `S3_BUCKET` passes env validation.
- The generated `DATABASE_URL` now uses `uselibpqcompat=true&sslmode=require` because the app container must connect to RDS over TLS without assuming a bundled CA chain.
- The stack now stores the generated `DATABASE_URL` and operator token in AWS Secrets Manager and injects them through ECS `secrets`, not plain environment variables. Existing stacks can instead point at already-created secret ARNs so CloudFormation can be reconciled without recreating those secrets.
- The runtime image must include `dist/src/db/migrations/*.sql`; the container cannot rely on source-only migration files once compiled.
- The task role must allow both `s3:GetBucketTagging` and `s3:PutBucketTagging`, and the app must not rewrite bucket tags when the desired app tags are already present on a CloudFormation-managed bucket.

Recommended naming:

- current production-serving stack name: `nyaaywatch-staging` (legacy; do not create another stack with the same effective resource names)
- target production stack name: `nyaaywatch-production`
- target staging stack name: `nyaaywatch-staging`
- current production-serving ECR repo: `nyaaywatch-staging`
- current production-serving alarm dashboard: `nyaaywatch-staging`
- future dedicated staging stack: use distinct RDS, S3, Secrets Manager, schedules, and alert resources even if the template is reused

## Deploy

1. Build and push the application image to ECR as `linux/amd64`.

```bash
./infra/aws/staging/build-and-push.sh \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:alpha-20260415
```

Why the explicit platform:

- the staging ECS service runs on Fargate with `linux/amd64`
- a default Apple Silicon build can push a manifest that Fargate cannot pull
- the helper script forces the correct platform and pushes directly to ECR

2. Deploy the CloudFormation stack:

```bash
export PUBLIC_BASE_URL=https://nyaaywatch.in
export CANONICAL_HOST=nyaaywatch.in
export LEGACY_PRODUCTION_STACK=true
export CLOUDFLARE_ZONE_NAME=nyaaywatch.in
export CLOUDFLARE_API_TOKEN_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:123456789012:secret:nyaaywatch-staging/cloudflare-api-token
export EXISTING_DATABASE_URL_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:123456789012:secret:nyaaywatch-staging/database-url
export EXISTING_OPERATOR_API_TOKEN_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:123456789012:secret:nyaaywatch-staging/operator-api-token

./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-staging \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:latest \
  '<operator-token>' \
  '<database-password>' \
  '<certificate-arn>' \
  '[alarm-email]'
```

For a future reality-named production replacement, use a separate stack name and explicit environment values rather than mutating the legacy stack in place:

```bash
export PROJECT_NAME=nyaaywatch
export ENVIRONMENT_NAME=production
export PUBLIC_BASE_URL=https://nyaaywatch.in
export CANONICAL_HOST=nyaaywatch.in
export CLOUDFLARE_ZONE_NAME=nyaaywatch.in
export MANAGE_CANONICAL_REDIRECT_RULES=true
export DATABASE_SNAPSHOT_IDENTIFIER=nyaaywatch-prod-cutover-YYYYMMDD-HHMM
export STACK_DATABASE_ALLOCATED_STORAGE=20
export SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true

./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-production \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:latest \
  '<operator-token>' \
  '<source-database-password-until-post-cutover-rotation>' \
  '<certificate-arn>' \
  '[alarm-email]'
```

For the preferred production cutover path, create a manual snapshot from the current production backing database first, deploy the target with `DATABASE_SNAPSHOT_IDENTIFIER`, then copy the current artifacts bucket into the target bucket before DNS cutover. AWS RDS snapshot restore inherits the database name, master username, password, and engine version from the source database; the password argument above is still used for the generated `DATABASE_URL` secret and must match the restored database password until a deliberate post-cutover rotation. `SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true` is required so that secret cannot drift silently. The deploy helper verifies the snapshot master username and allocated storage, and verifies the DB name from snapshot metadata or, for PostgreSQL snapshots where AWS omits `DBName`, from the source DB instance only when the snapshot exposes an immutable `DbiResourceId` and the current source instance still matches that snapshot lineage before it creates the generated secret. Do not combine `DATABASE_SNAPSHOT_IDENTIFIER` with `EXISTING_DATABASE_URL_SECRET_ARN`. After a stack is created from a snapshot, later deploys must keep the same snapshot parameter; the deploy helper preserves the existing snapshot ID, DB identity, and allocated-storage parameters, refuses to add snapshot restore to an already-existing non-snapshot stack, refuses a different snapshot unless `ALLOW_DATABASE_SNAPSHOT_REPLACEMENT=true` is set, and refuses DB name or username changes unless `ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE=true` is set for an intentional matching-database change. The helper only calls `describe-db-snapshots` when `DATABASE_SNAPSHOT_IDENTIFIER` is explicitly supplied, so normal post-cutover deploys do not depend on keeping the original manual snapshot record forever.

For the reclaimed isolated staging stack, do not use the production host, production Cloudflare purge path, or production resource prefix:

```bash
export PROJECT_NAME=nyaaywatch
export ENVIRONMENT_NAME=staging
export PUBLIC_BASE_URL=https://staging.nyaaywatch.in
export CANONICAL_HOST=staging.nyaaywatch.in
export LEGACY_HOSTS=
export MANAGE_CANONICAL_REDIRECT_RULES=false
export RECLAIMED_STAGING_NAME=true

./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-staging \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:latest \
  '<operator-token>' \
  '<database-password>' \
  '<staging-certificate-arn>' \
  '[alarm-email]'
```

As of `2026-04-29`, the dedicated staging stack was reclaimed as `nyaaywatch-staging` with `PUBLIC_BASE_URL=https://staging.nyaaywatch.in` and ACM certificate `arn:aws:acm:ap-south-1:723951822728:certificate/12a69434-d2e6-4a6f-a42e-d7bf64797870`. That stack was deleted on `2026-07-09` for cost; the `staging.nyaaywatch.in` CNAME was removed `2026-07-12`. Re-deploy with `RECLAIMED_STAGING_NAME=true` and recreate the Cloudflare CNAME when a rehearsal is needed.

`deploy-stack.sh` refuses the dangerous combinations that would deploy non-production with production hostnames or let non-production manage production canonical redirect rules. The reclaimed `nyaaywatch-staging` stack should use `RECLAIMED_STAGING_NAME=true`.

3. Wait for the stack to finish and note the outputs:
   - `ServiceUrl`
   - `VpcId`
   - `PublicSubnetIds`
   - `PrivateSubnetIds`
   - `ArtifactsBucketName`
   - `DatabaseEndpoint`
   - `DatabaseUrlSecretArn`
   - `CloudflareApiTokenSecretArn` if configured
   - `LogGroupName`
   - `AlarmTopicArn`
   - `DashboardName`
   - `CertificateArn`
   - `OperatorApiTokenSecretArn`

4. Copy the live values into `docs/internal/DEPLOYMENT_STATUS.md` so the current environment URL and resource names are discoverable without re-querying AWS.

If an older stack already had the priority-10 `.com -> .in` listener rules outside CloudFormation and the first reconciliation had to use `MANAGE_CANONICAL_REDIRECT_RULES=false`, import those live rules immediately after the stack is otherwise healthy:

```bash
./infra/aws/staging/import-canonical-redirect-rules.sh nyaaywatch-staging
```

That import path is the preferred end state. Leaving the canonical redirect rules permanently unmanaged should be treated as temporary drift, not the normal staging posture.

Note:

- once an ACM certificate for the public hostnames is attached, the direct ALB hostname will not match that certificate name on `https://...elb.amazonaws.com`
- use the public hostname for browser verification
- use AWS metrics and logs for low-level ALB verification rather than relying on the raw ALB HTTPS hostname
- the staging stack now includes ALB host-header redirect rules that canonically send `nyaaywatch.com` and `www.nyaaywatch.com` to `https://nyaaywatch.in`

## Automatic Deploy From `main`

Merges to `main` now auto-deploy the current production public-alpha stack through GitHub Actions after the verify job passes.

The deploy job:

- assumes `arn:aws:iam::723951822728:role/nyaaywatch-github-deploy-role` via GitHub OIDC
- keeps the role's inline policy mirrored in `infra/aws/staging/github-deploy-role-policy.json`; apply it with `aws iam put-role-policy --role-name nyaaywatch-github-deploy-role --policy-name nyaaywatch-github-deploy-policy --policy-document file://infra/aws/staging/github-deploy-role-policy.json`
- builds a `linux/amd64` image and pushes both the commit-SHA tag and `latest` to `723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging`; the repository name is historical and will be renamed separately
- discovers the live ECS service from `PRODUCTION_STACK_NAME`; the value is `nyaaywatch-production`
- registers a fresh task definition revision pinned to the commit-SHA image
- preserves ECS `secrets` entries for `DATABASE_URL` and `OPERATOR_API_TOKEN`, wires Cloudflare auth from `CLOUDFLARE_API_TOKEN_SECRET_ARN`, and passes `CLOUDFLARE_WEB_ANALYTICS_TOKEN` when the GitHub secret is configured
- updates the ECS service and waits for steady state
- reconciles the lower-court, Supreme Court, reviewed-High-Court, publish-pending, and public-alpha-ops schedules against the new live task definition
- keeps cadence-limited NJDG missing-zero outreach sending through the SES-verified `data@nyaaywatch.in` identity with aligned SPF/DKIM/DMARC, BCCs the sender, sets any configured reply-to address, and archives each outbound payload under `s3://nyaaywatch-production-artifacts-723951822728/ops/njdg-missing-zero-outreach/`
- confirms `/health` through the configured `PUBLIC_BASE_URL` when present, falling back to the raw ALB `ServiceUrl` only for stacks without Cloudflare-only origin protection

This keeps the deploy path inside the existing AWS stack instead of re-running CloudFormation with database or operator secrets on every merge.

## Internal Fetch Schedule

The live stack can keep an internal raw-fetch cadence without auto-publishing public data.

Default schedules:

- lower-court states: every day at `8:00 AM Asia/Kolkata` across all implemented states
- Supreme Court: every day at `8:10 AM Asia/Kolkata`
- reviewed High Courts: every day at `8:20 AM Asia/Kolkata` across High Court profiles whose `sourceReviewStatus` is `reviewed`
- public-alpha ops smoke monitor: every `30` minutes against representative surfaces on the deployed `PUBLIC_BASE_URL`
- behavior: each schedule launches its own one-off ECS task, keeps failures isolated by tier, and leaves public publication unchanged

Manual reconcile command:

```bash
npm run operator:reconcile-fetch-schedule
```

What it does:

- discovers the current live ECS service, task definition, and awsvpc network settings
- creates or updates the scheduler IAM role
- creates or updates the EventBridge Scheduler schedules for lower courts, Supreme Court, reviewed High Courts, the publish-pending sweep, and the public-alpha monitor
- keeps all schedules pointed at the current ECS task definition after each deploy

Bootstrap note:

- the GitHub Actions deploy role can update the schedule target, but it cannot create or rewrite IAM roles
- the GitHub Actions deploy role must allow `scheduler:GetSchedule`, `scheduler:UpdateSchedule`, and `scheduler:CreateSchedule` for all five schedule ARNs:
  - `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-production-weekday-internal-fetch`
  - `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-production-supreme-court-internal-fetch`
  - `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-production-high-courts-internal-fetch`
  - `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-production-publish-pending-sweep`
  - `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-production-public-alpha-ops-monitor`
- first-time schedule bootstrap or scheduler-role policy changes still require an IAM-capable operator run
- once the role exists, CI reconciles the schedule against the latest ECS task definition on every `main` deploy

Alerting note:

- the production stack now counts `NYAAYWATCH_PUBLIC_ALPHA_OPS_ALERT=` log lines from the scheduled monitor into the `NyaayWatch/Observability` metric `${ProjectName}-${EnvironmentName}-public-alpha-ops-alerts`
- CloudWatch alarm `${ProjectName}-${EnvironmentName}-public-alpha-ops` fans that signal out through the existing SNS alert topic
- production image redeploys keep one ECS task by default for `ENVIRONMENT_NAME=production` (cost-aware alpha); set `PRODUCTION_DESIRED_COUNT=2` or `DESIRED_COUNT=2` for an HA window
- the stack template can enable ALB access logs under `s3://<artifacts-bucket>/alb-access-logs/AWSLogs/<account-id>/`; set `ALB_ACCESS_LOGS_ENABLED=false` only for a deliberate non-attribution rehearsal
- production stack deploys attach regional WAF rules `non-cloudflare-origin-block` and `forwarded-client-rate-limit` to the ALB by default; non-production stack deploys leave that Cloudflare-only origin protection off unless `PUBLIC_INGRESS_WEB_ACL_ENABLED=true` is set for a proxied hostname. Refresh `CLOUDFLARE_IPV4_CIDRS` / `CLOUDFLARE_IPV6_CIDRS` from Cloudflare if their published ranges change, set `PUBLIC_INGRESS_RATE_LIMIT_PER_FIVE_MINUTES` to tune the default `1200` requests per five minutes, or `PUBLIC_INGRESS_WEB_ACL_ENABLED=false` only for an intentional production bypass.
- cost budget alerts are only meaningful after the account-level cost allocation tags `project` and `env` are active in AWS Billing; `deploy-stack.sh` passes those stack tags, and ECS service/scheduled tasks propagate the task-definition tags for Fargate attribution. Default `MonthlyBudgetUsd` is `80` per environment to match observed full-stack alpha spend; set `MONTHLY_BUDGET_USD` to override. `deploy-stack.sh` always passes `MonthlyBudgetUsd` so existing stacks pick up budget changes on the next deploy.

## Heavy-State Operator Lane

Long-running internal-state fetches should use the ECS-backed operator lane instead of the Cloudflare-fronted public hostname.

Default command:

```bash
npm run operator:production -- --state UP fetch "Internal Uttar Pradesh fetch"
```

What it does:

- discovers the live `nyaaywatch-production` ECS service from CloudFormation
- reuses the current service task definition and network configuration
- starts a one-off ECS task that runs the ECS operator entrypoint inside the live runtime
- waits for the task to stop
- reads the CloudWatch log stream and prints the operator JSON result locally

Use the same helper for `inspect`, `publish`, `replay`, and `rollback` when a heavier state should stay off the public HTTP operator path.

## Operator Validation Flow

Run the staging validation only after the ECS service is healthy and the ALB URL responds on `/health`.

1. Confirm health:

```bash
curl -fsSL http://<service-url>/health
```

2. Trigger a real fetch:

```bash
curl -fsSL -X POST "http://<service-url>/operator/runs/fetch" \
  -H "content-type: application/json" \
  -H "x-operator-token: <operator-token>" \
  -d '{"note":"Staging operator validation fetch"}'
```

3. Inspect the returned `run.id`:

```bash
curl -fsSL "http://<service-url>/operator/runs/<run-id>" \
  -H "x-operator-token: <operator-token>"
```

4. Publish the completed run:

```bash
curl -fsSL -X POST "http://<service-url>/operator/runs/<run-id>/publish" \
  -H "content-type: application/json" \
  -H "x-operator-token: <operator-token>" \
  -d '{"note":"Staging operator validation publish"}'
```

5. Replay the published run:

```bash
curl -fsSL -X POST "http://<service-url>/operator/runs/<run-id>/replay" \
  -H "content-type: application/json" \
  -H "x-operator-token: <operator-token>" \
  -d '{"note":"Staging operator validation replay"}'
```

6. Roll back to the original publication if required:

```bash
curl -fsSL -X POST "http://<service-url>/operator/publications/<publication-id>/rollback" \
  -H "content-type: application/json" \
  -H "x-operator-token: <operator-token>" \
  -d '{"note":"Staging operator validation rollback"}'
```

7. Review logs:

```bash
aws logs tail /ecs/nyaaywatch-staging --follow --region ap-south-1
```

8. Review alarms and dashboard:

```bash
aws cloudwatch describe-alarms --region ap-south-1
aws cloudwatch get-dashboard --dashboard-name nyaaywatch-staging --region ap-south-1
```

## Current Status

`P4.5` was completed on 2026-04-15 against the live `nyaaywatch-staging` stack in `ap-south-1`.

That same stack used to back `https://nyaaywatch.in`, but production traffic now runs on `nyaaywatch-production`. The rollback tradeoff has been accepted, and `nyaaywatch-staging` is the dedicated staging lane.

Validated successfully:

- `/health`
- `POST /operator/runs/fetch`
- `GET /operator/runs/:runId`
- `POST /operator/runs/:runId/publish`
- `POST /operator/runs/:runId/replay`
- `POST /operator/publications/:publicationId/rollback`
- `GET /v1/stats/himachal` after rollback to confirm the public API reads the active publication pointer

Operational hardening added on 2026-04-15:

- CloudWatch dashboard `nyaaywatch-staging`
- SNS alarm topic `arn:aws:sns:ap-south-1:723951822728:nyaaywatch-staging-alerts`
- ACM certificate output `arn:aws:acm:ap-south-1:723951822728:certificate/c55eb076-1c4c-4d94-a29b-454100e3ebc7`
- structured JSON request and operator logs in `/ecs/nyaaywatch-staging`
- a documented `linux/amd64` image build path for Apple Silicon deploys

Temporary proof stacks from earlier failed attempts can be deleted after validation; they are not part of the long-lived staging shape.

## Next Operational Step

`staging.nyaaywatch.in` points at `nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com` with a DNS-only Cloudflare CNAME, and the reclaimed staging stack has been verified through normal DNS.
