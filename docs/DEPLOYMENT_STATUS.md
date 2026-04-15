# Deployment Status

Operational source of truth for where NyaayWatch is currently running and how to verify the live environment.

Keep this file updated whenever the staging stack changes, a public alpha URL is assigned, or a domain cutover is completed.

## Current Environments

### Local Development

- URL: `http://localhost:3000`
- Backing services: local Node app, local PostgreSQL, LocalStack S3
- Intended use: development, fixture-backed QA, local operator-flow checks

### AWS Staging

- Stack name: `nyaaywatch-staging`
- Region: `ap-south-1`
- Public URL: `TODO`
- ECS service: `TODO`
- ALB DNS name: `TODO`
- CloudWatch log group: `/ecs/nyaaywatch-staging`
- Artifacts bucket: `TODO`
- Database endpoint: `TODO`
- Intended use: operator validation, pre-release public-alpha verification, domain cutover target

### Public Alpha

- Domain: `TODO`
- Backing stack: `TODO`
- Status: `not yet assigned`

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

## Release Use

Before treating a deployment as the public alpha:

1. fill in this file with the actual live URL and resource names
2. run `docs/ALPHA_RELEASE_CHECKLIST.md`
3. confirm the domain cutover steps in `docs/DOMAIN_CUTOVER_CHECKLIST.md` if a custom domain is involved
