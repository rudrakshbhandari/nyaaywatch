# AWS Staging Stack

This directory defines the isolated AWS staging shape for NyaayWatch's Himachal alpha:

- one ECS Fargate service running the application container
- one PostgreSQL RDS instance as the canonical store
- one `nyaaywatch-` prefixed S3 bucket for raw and normalized artifacts
- CloudWatch Logs for basic container logging
- an operator validation flow that exercises fetch, inspect, publish, replay, and rollback against staging

## Resources

The staging stack template provisions:

- S3 bucket tagged `project=nyaaywatch env=staging`
- CloudWatch log group `/ecs/nyaaywatch-staging`
- ECS cluster, task definition, and Fargate service
- public Application Load Balancer
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

## Required Inputs

You need:

- an ECR image URI for the app container
- a strong database password
- an operator API token for staging

The stack creates its own isolated VPC with:

- two public subnets for the ALB and ECS tasks
- two private subnets for PostgreSQL
- an internet gateway

Application config constraints to preserve during staging validation:

- `EnvironmentName` must remain `staging` so `DEPLOY_ENV` satisfies the app env schema.
- `ProjectName` must stay `nyaaywatch`-prefixed so the derived `S3_BUCKET` passes env validation.
- The generated `DATABASE_URL` now uses `uselibpqcompat=true&sslmode=require` because the app container must connect to RDS over TLS without assuming a bundled CA chain.

Recommended naming:

- stack name: `nyaaywatch-staging`
- ECR repo: `nyaaywatch-staging`

## Deploy

1. Build and push the application image to ECR.
2. Deploy the CloudFormation stack:

```bash
./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-staging \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:latest \
  '<operator-token>' \
  '<database-password>'
```

3. Wait for the stack to finish and note the outputs:
   - `ServiceUrl`
   - `VpcId`
   - `PublicSubnetIds`
   - `PrivateSubnetIds`
   - `ArtifactsBucketName`
   - `DatabaseEndpoint`
   - `LogGroupName`

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

## Current Status

The staging IaC and runbook are committed, but the stack still needs to be deployed and validated in AWS before `P4.5` can be marked complete in `docs/MVP_EXECUTION_PLAN.md`.
