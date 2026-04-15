# AWS PR Preview Services

PR previews use AWS App Runner so reviewers can see the public web surface without provisioning PostgreSQL, S3, or the full ECS stack for every branch.

The preview runtime:

- runs the same application image as production
- sets `APP_MODE=preview`
- seeds one in-memory published snapshot from the checked-in Himachal fixtures
- serves the public routes and APIs for UI, copy, and responsive review

It is intentionally not a full operator environment.

## Required AWS Roles

- GitHub deploy role for pull request workflows:
  - `arn:aws:iam::723951822728:role/nyaaywatch-github-preview-role`
- App Runner ECR access role:
  - `arn:aws:iam::723951822728:role/nyaaywatch-apprunner-ecr-access-role`

The App Runner access role must trust `build.apprunner.amazonaws.com` and use the managed policy `AWSAppRunnerServicePolicyForECRAccess`.

## Manual Usage

Build and push a preview image:

```bash
./infra/aws/staging/build-and-push.sh \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:pr-21-local
```

Deploy or update a preview service:

```bash
./infra/aws/preview/deploy-service.sh \
  nyaaywatch-pr-21 \
  723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:pr-21-local \
  arn:aws:iam::723951822728:role/nyaaywatch-apprunner-ecr-access-role
```

Delete a preview service:

```bash
./infra/aws/preview/delete-service.sh nyaaywatch-pr-21
```
