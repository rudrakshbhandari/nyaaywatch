# Deployment Status

Operational source of truth for where NyaayWatch is currently running and how to verify the live environment.

Keep this file updated whenever the staging stack changes, a public alpha URL is assigned, or a domain cutover is completed.

## Current Environments

### Local Development

- URL: `http://localhost:3000`
- Backing services: local Node app, local PostgreSQL, LocalStack S3
- Intended use: development, fixture-backed QA, local operator-flow checks

### Pull Request Previews

- URL shape: App Runner service URL posted back to each PR
- Backing runtime: same app image with `APP_MODE=preview`
- Data source: in-memory fixture-seeded published snapshot
- Intended use: web design, UI/UX, copy, and responsive review without live infra dependencies

### AWS Staging

- Stack name: `nyaaywatch-staging`
- Region: `ap-south-1`
- Public URL: `http://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com`
- Public hostname for browser checks: `https://nyaaywatch.in`
- ECS service: `nyaaywatch-staging-Service-zXxqGRuc7amS`
- ECS task definition: `nyaaywatch-staging:9`
- ALB DNS name: `nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com`
- ACM certificate ARN: `arn:aws:acm:ap-south-1:723951822728:certificate/c55eb076-1c4c-4d94-a29b-454100e3ebc7`
- CloudWatch log group: `/ecs/nyaaywatch-staging`
- CloudWatch dashboard: `nyaaywatch-staging`
- Alarm topic ARN: `arn:aws:sns:ap-south-1:723951822728:nyaaywatch-staging-alerts`
- CloudWatch alarms:
  - `nyaaywatch-staging-health-endpoint`
  - `nyaaywatch-staging-alb-target-5xx`
  - `nyaaywatch-staging-app-errors`
- Artifacts bucket: `nyaaywatch-staging-artifacts-723951822728`
- Database endpoint: `nyaaywatch-staging-stagingdatabase-qcmxgxoytk9m.ct0sogc8a838.ap-south-1.rds.amazonaws.com`
- Intended use: operator validation, pre-release public-alpha verification, domain cutover target
- Deploy path: GitHub Actions auto-deploys every successful `main` merge by publishing a new ECR image and rolling the ECS service in place

Operational notes:

- Port `80` on the ALB redirects to `443`.
- Canonical `.com -> .in` routing requires the ACM certificate to cover `nyaaywatch.com` and `www.nyaaywatch.com` in addition to the `.in` hostnames.
- Direct `https://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com` checks will fail hostname validation because the certificate is for the public domain, not the raw ELB hostname.
- Use `https://nyaaywatch.in` for browser validation and the ALB DNS name for low-level AWS resource identification only.

### Public Alpha

- Domain: `https://nyaaywatch.in`
- Backing stack: `nyaaywatch-staging`
- Status: `live`
- Release path: verified `main` merges auto-roll the live ECS service through GitHub Actions
- Current active publication: `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
- Current active published snapshot: `snapshot_8cda4026-d7da-43d1-a2c4-2e61fc717be7`
- Public stats source snapshot date: `2026-04-10`
- Public stats methodology version: `2026.04-alpha`

## How To Retrieve The AWS Staging URL

If the staging URL is not already recorded above, retrieve it from CloudFormation:

```bash
aws cloudformation describe-stacks \
  --stack-name nyaaywatch-staging \
  --region ap-south-1 \
  --query "Stacks[0].Outputs"
```

Look for:

- `ServiceUrl`
- `ArtifactsBucketName`
- `DatabaseEndpoint`
- `LogGroupName`

Then write those values back into this file in the same PR or deployment change.

## Minimum Live Verification

Run these checks against the current public URL or staging `ServiceUrl`:

```bash
curl -fsSL <base-url>/health
curl -fsSL <base-url>/v1/stats/himachal
curl -fsSL <base-url>/v1/districts
curl -fsSL <base-url>/v1/trends
```

Expected:

- `/health` returns `ok: true`
- public API responses come from a published snapshot, not an empty or unpublished state

## Operator Verification

Operator endpoints must remain protected by `x-operator-token`.

Minimum manual verification:

1. call `GET /operator/publications` without a token and confirm it is rejected
2. call an operator endpoint with the correct token and confirm it succeeds
3. confirm the public routes still do not expose unpublished run state

Latest confirmed operator validation:

- Fresh alpha review cycle completed on 2026-04-15:
  - fetch run `run_0d2b486b-91fd-4592-9507-629076e8cd83`
  - publish `publication_60a42984-3fd2-4e59-88c6-230e0801d78e`
  - replay run `run_dfe8d4e5-a6e4-4211-ae4a-47ddc5a74faa`
  - rollback `publication_307fa07c-4e7d-4bff-a498-ad2ea17694be`
- Post-deploy validation cycle completed on 2026-04-15 after task definition `:9` rolled out:
  - fetch run `run_f225c213-4c88-4095-9653-5e0d065add95`
  - publish `publication_4a8ab19f-1d2a-4b9b-b6c4-1ab2d610f80a`
  - replay run `run_bac1bec6-b4cc-467c-9f77-31e2832cf64c`
  - rollback `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
  - public stats returned to `publishedFromRunId=run_5d8880eb-ed95-4e08-b3aa-96437d5f45d9`

## Release Use

Before treating a deployment as the public alpha:

1. fill in this file with the actual live URL and resource names
2. run `docs/ALPHA_RELEASE_CHECKLIST.md`
3. confirm the domain cutover steps in `docs/DOMAIN_CUTOVER_CHECKLIST.md` if a custom domain is involved
