# AWS PR Preview Services

PR previews use AWS App Runner so reviewers can see the public web surface without provisioning PostgreSQL, S3, or the full ECS stack for every branch.

The preview runtime:

- runs the same application image as production
- sets `APP_MODE=preview`
- seeds one in-memory published snapshot from the checked-in Himachal fixtures
- serves the public routes and APIs for UI, copy, and responsive review

It is intentionally not a full operator environment.

The GitHub preview job treats App Runner quota exhaustion as an infrastructure-capacity condition, not a code regression:

- if a preview service can be created or updated, the workflow comments with the preview URL
- if App Runner rejects a new service because the account is already at its service quota, the workflow now reconciles stale preview services against the current open-PR set and retries once before posting a "preview unavailable" comment

Preview creation also no longer waits for the full `verify` job to finish. It starts after the fast secret scan so copy and design review can begin while the heavier test suite is still running.

## Long-Term Cleanup

Preview cleanup now has three layers:

1. `pull_request.closed` deletes the matching preview service directly.
2. Every preview deploy reconciles existing `nyaaywatch-pr-*` App Runner services against the set of currently open PRs before attempting create/update.
3. `.github/workflows/preview-reconcile.yml` runs hourly and can be triggered manually to prune any stale preview services left behind by missed close events or App Runner state races.

The preview helpers now page through the full App Runner `list-services` inventory before deciding what to keep, delete, or update. That matters once the account has more than one page of preview services: stale entries beyond the first page still count against the shared App Runner service quota.

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

The delete helper waits for App Runner services to leave transient states such as
`OPERATION_IN_PROGRESS` before calling `DeleteService`. This avoids the cleanup
race where a just-updated preview is still settling when the PR close workflow
tries to remove it.

Reconcile all preview services against the current open-PR allowlist:

```bash
./infra/aws/preview/reconcile-services.sh /tmp/open-preview-services.txt
```
