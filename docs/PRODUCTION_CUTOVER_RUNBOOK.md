# Production Cutover Runbook

Runbook for replacing the legacy production-serving `nyaaywatch-staging` AWS stack with a reality-named `nyaaywatch-production` stack.

The current production site is `https://nyaaywatch.in`. The current backing stack is still named `nyaaywatch-staging`; treat it as production until this runbook is complete and verified.

## Non-Negotiables

- Do not rename or mutate the legacy production stack in place.
- Do not point DNS at a target stack until public read parity, operator auth, alarms, and rollback are verified.
- Do not run target production schedules before cutover.
- Do not expose raw upstream artifacts publicly.
- Record the final evidence in `docs/internal/DEPLOYMENT_STATUS.md` and `docs/internal/RELEASE_HISTORY.md`.

## Phase 0: Read-Only Inventory

Run:

```bash
npm run infra:production-preflight
npm run infra:production-cutover-inventory
```

Expected:

- current stack status is a stable terminal CloudFormation status
- current stack exposes the required output interface
- `nyaaywatch-production` does not exist yet, or exists with a reviewed stable status and required outputs
- `https://nyaaywatch.in/health` returns `ok: true`
- current ECS service, task definition, image, S3 bucket, secret ARNs, and scheduler target task definitions are recorded

This phase is read-only.

## Phase 1: Data Bootstrap Decision

Choose one data path before provisioning or cutover:

1. **Preferred: clone production data into isolated production resources.**
   - Restore or copy the current production RDS data into the `nyaaywatch-production` database.
   - Sync the current production artifacts bucket into the `nyaaywatch-production` artifacts bucket.
   - Verify public pages and operator replay/rollback against the target ALB before DNS.
   - This is the cleanest environment split and avoids future replay failures from missing S3 artifacts.

2. **Temporary bridge: share the current production database secret.**
   - Deploy `nyaaywatch-production` with `EXISTING_DATABASE_URL_SECRET_ARN` pointing at the current production `DatabaseUrlSecretArn`.
   - Do not enable target schedules before DNS.
   - This can verify the app and ALB quickly, but it is not the final clean split because old run artifacts still live in the legacy bucket while the target stack gets a new bucket.
   - Treat this as a bridge only if a database clone is too slow for the cutover window.

Do not proceed without recording which path is being used.

## Phase 2: Parallel Stack Provision

Use a fresh image already deployed successfully to the current production stack.

For an isolated target stack:

```bash
export PROJECT_NAME=nyaaywatch
export ENVIRONMENT_NAME=production
export PUBLIC_BASE_URL=https://nyaaywatch.in
export CANONICAL_HOST=nyaaywatch.in
export CLOUDFLARE_ZONE_NAME=nyaaywatch.in
export MANAGE_CANONICAL_REDIRECT_RULES=true

./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-production \
  '<current-production-image-uri>' \
  '<target-operator-token>' \
  '<target-database-password>' \
  '<certificate-arn>' \
  '[alarm-email]'
```

If using the temporary shared-database bridge, add:

```bash
export EXISTING_DATABASE_URL_SECRET_ARN='<current-production-database-url-secret-arn>'
```

Use a separate target operator token unless there is a deliberate reason to share the current one.

## Phase 3: Target Verification Before DNS

Verify through the target ALB before DNS changes:

```bash
aws cloudformation describe-stacks \
  --stack-name nyaaywatch-production \
  --region ap-south-1 \
  --query "Stacks[0].Outputs"
```

Then use the target `ServiceUrl` for low-level health checks:

```bash
curl -fsSL <target-service-url>/health
```

For public-host verification before DNS, connect the production hostname to the target ALB:

```bash
curl --connect-to nyaaywatch.in:443:<target-alb-dns>:443 https://nyaaywatch.in/health
```

`release:verify` does not currently support `--connect-host`, so use focused `curl --connect-to` checks for `/`, `/v1/stats/himachal`, `/v1/districts`, `/v1/trends`, `/supreme-court`, `/high-courts`, `/data`, `/methodology`, and `/api` before DNS. After DNS cutover, run the normal release verifier against `https://nyaaywatch.in`.

Also verify:

- unauthenticated operator routes return `401`
- target logs emit no structured app errors during verification
- target CloudWatch alarms exist and are `OK` or have a documented cold-start reason
- target stack outputs are copied into a temporary evidence note before DNS

## Phase 4: DNS Cutover

Only after Phase 3 is green:

1. Lower DNS TTL if it is not already low.
2. Point `nyaaywatch.in` at the `nyaaywatch-production` ALB.
3. Verify the public hostname over normal DNS:

```bash
curl -fsSL https://nyaaywatch.in/health
npm run release:verify -- --base-url=https://nyaaywatch.in
```

4. Reconcile or create schedules for `nyaaywatch-production` only after normal public checks are green.
5. Run:

```bash
OPERATOR_API_TOKEN='<target-production-token>' \
npm run ops:verify-internal-fetch-schedule -- --base-url=https://nyaaywatch.in --stack-name=nyaaywatch-production
```

## Phase 5: Rollback

Until the retirement window ends, rollback is DNS-first:

1. Point `nyaaywatch.in` back to the legacy `nyaaywatch-staging` ALB.
2. Confirm:

```bash
curl -fsSL https://nyaaywatch.in/health
npm run release:verify -- --base-url=https://nyaaywatch.in
```

3. Disable any target `nyaaywatch-production` schedules if they were enabled.
4. Preserve target logs and CloudFormation outputs for investigation.

Do not delete the legacy production stack during the cutover window.

## Phase 6: Retire Legacy Name And Reclaim Staging

After the production stack has survived the agreed observation window:

1. Update `docs/internal/DEPLOYMENT_STATUS.md` so production points at `nyaaywatch-production`.
2. Update `.github/workflows/ci.yml` and `.github/workflows/ops-watchdog.yml` so `PRODUCTION_STACK_NAME=nyaaywatch-production`.
3. Retire or snapshot the legacy `nyaaywatch-staging` production resources.
4. Provision a dedicated staging stack named `nyaaywatch-staging` with isolated RDS, S3, Secrets Manager values, schedules, dashboard, and alarm topic.
5. Update `TODOS.md` and release history with the cutover evidence.

## Current Open Decision

The next live-action blocker is the data bootstrap choice:

- isolated database plus S3 sync, preferred
- temporary shared-database bridge, faster but not a final clean split

Make that choice before running any mutating CloudFormation command for `nyaaywatch-production`.
