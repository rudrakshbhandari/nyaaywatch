# AWS Staging Stack

This directory defines the isolated AWS staging shape for NyaayWatch's Himachal alpha:

- one ECS Fargate service running the application container
- one PostgreSQL RDS instance as the canonical store
- one `nyaaywatch-` prefixed S3 bucket for raw and normalized artifacts
- CloudWatch Logs for structured application logging
- CloudWatch alarms for health-check failure, ALB target 5xx responses, and structured app errors
- one CloudWatch dashboard for release-time operational review
- an operator validation flow that exercises fetch, inspect, publish, replay, and rollback against staging

## Resources

The staging stack template provisions:

- S3 bucket tagged `project=nyaaywatch env=staging`
- CloudWatch log group `/ecs/nyaaywatch-staging`
- SNS topic for alarm fan-out
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
- an operator API token for staging
- an ACM certificate ARN for every public hostname the ALB must terminate, including `nyaaywatch.in`, `www.nyaaywatch.in`, `nyaaywatch.com`, and `www.nyaaywatch.com` if `.com -> .in` canonical redirects are enabled

Optional:

- an alarm email address to subscribe to the staging SNS topic
- `PUBLIC_BASE_URL` if the runtime should emit stable public URLs for release verification and cache invalidation
- `CLOUDFLARE_ZONE_NAME` if the runtime should resolve the Cloudflare zone by name
- `CLOUDFLARE_API_TOKEN_SECRET_ARN` if publish / rollback should purge Cloudflare cache without storing the token in plaintext task-definition environment variables
- `EXISTING_DATABASE_URL_SECRET_ARN` if an existing stack should reference a pre-created `DATABASE_URL` secret instead of creating a new one
- `EXISTING_OPERATOR_API_TOKEN_SECRET_ARN` if an existing stack should reference a pre-created operator-token secret instead of creating a new one
- `MANAGE_CANONICAL_REDIRECT_RULES=false` only as a temporary reconciliation escape hatch if an older stack already has unmanaged `.com -> .in` listener rules; the intended steady state is to import those rules so CloudFormation owns them too

The stack creates its own isolated VPC with:

- two public subnets for the ALB and ECS tasks
- two private subnets for PostgreSQL
- an internet gateway

Application config constraints to preserve during staging validation:

- `EnvironmentName` must remain `staging` so `DEPLOY_ENV` satisfies the app env schema.
- `ProjectName` must stay `nyaaywatch`-prefixed so the derived `S3_BUCKET` passes env validation.
- The generated `DATABASE_URL` now uses `uselibpqcompat=true&sslmode=require` because the app container must connect to RDS over TLS without assuming a bundled CA chain.
- The stack now stores the generated `DATABASE_URL` and operator token in AWS Secrets Manager and injects them through ECS `secrets`, not plain environment variables. Existing stacks can instead point at already-created secret ARNs so CloudFormation can be reconciled without recreating those secrets.
- The runtime image must include `dist/src/db/migrations/*.sql`; the container cannot rely on source-only migration files once compiled.
- The task role must allow both `s3:GetBucketTagging` and `s3:PutBucketTagging`, and the app must not rewrite bucket tags when the desired app tags are already present on a CloudFormation-managed bucket.

Recommended naming:

- stack name: `nyaaywatch-staging`
- ECR repo: `nyaaywatch-staging`
- alarm dashboard: `nyaaywatch-staging`

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

4. Copy the live values into `docs/DEPLOYMENT_STATUS.md` so the current staging URL and resource names are discoverable without re-querying AWS.

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

Merges to `main` now auto-deploy through GitHub Actions after the verify job passes.

The deploy job:

- assumes `arn:aws:iam::723951822728:role/nyaaywatch-github-deploy-role` via GitHub OIDC
- builds a `linux/amd64` image and pushes both the commit-SHA tag and `latest` to `723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging`
- discovers the live ECS service from the `nyaaywatch-staging` CloudFormation stack
- registers a fresh task definition revision pinned to the commit-SHA image
- preserves ECS `secrets` entries for `DATABASE_URL` and `OPERATOR_API_TOKEN`, and only wires Cloudflare auth from `CLOUDFLARE_API_TOKEN_SECRET_ARN`
- updates the ECS service and waits for steady state
- reconciles the internal raw-fetch schedule against the new live task definition
- confirms the raw ALB `ServiceUrl` still answers `/health`

This keeps the deploy path inside the existing AWS stack instead of re-running CloudFormation with database or operator secrets on every merge.

## Internal Fetch Schedule

The live stack can keep an internal raw-fetch cadence without auto-publishing public data.

Default schedules:

- lower-court states: every day at `8:00 AM Asia/Kolkata` across all implemented states
- Supreme Court: every day at `8:10 AM Asia/Kolkata`
- reviewed High Courts: every day at `8:20 AM Asia/Kolkata` across High Court profiles whose `sourceReviewStatus` is `reviewed`
- behavior: each schedule launches its own one-off ECS task, keeps failures isolated by tier, and leaves public publication unchanged

Manual reconcile command:

```bash
npm run operator:reconcile-fetch-schedule
```

What it does:

- discovers the current live ECS service, task definition, and awsvpc network settings
- creates or updates the scheduler IAM role
- creates or updates the EventBridge Scheduler schedules for lower courts, Supreme Court, and reviewed High Courts
- keeps all schedules pointed at the current ECS task definition after each deploy

Bootstrap note:

- the GitHub Actions deploy role can update the schedule target, but it cannot create or rewrite IAM roles
- first-time schedule bootstrap or scheduler-role policy changes still require an IAM-capable operator run
- once the role exists, CI reconciles the schedule against the latest ECS task definition on every `main` deploy

## Heavy-State Operator Lane

Long-running internal-state fetches should use the ECS-backed operator lane instead of the Cloudflare-fronted public hostname.

Default command:

```bash
npm run operator:staging -- --state UP fetch "Internal Uttar Pradesh fetch"
```

What it does:

- discovers the live `nyaaywatch-staging` ECS service from CloudFormation
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

After staging is healthy and documented, use `docs/DOMAIN_CUTOVER_CHECKLIST.md` to attach the real public domain to the ALB if you want this stack to serve the public alpha.
