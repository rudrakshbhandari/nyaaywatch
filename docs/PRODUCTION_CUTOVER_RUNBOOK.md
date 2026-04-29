# Production Cutover Runbook

Runbook for replacing the legacy production-serving `nyaaywatch-staging` AWS stack with a reality-named `nyaaywatch-production` stack.

Current status: `https://nyaaywatch.in` now points at `nyaaywatch-production`. Keep this runbook for cutover evidence, rollback context, and the remaining cleanup work to retire or snapshot the legacy `nyaaywatch-staging` production resources. The old `nyaaywatch-staging` stack has passed the first post-cutover observation check as rollback infrastructure; retire or rename it only through an explicit destructive cleanup decision.

## Non-Negotiables

- Do not rename or mutate the legacy production stack in place.
- Do not point DNS at a future target stack until public read parity, operator auth, alarms, and rollback are verified.
- Do not run future target production schedules before cutover.
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
   - Create a manual RDS snapshot from the current production backing database.
   - Deploy `nyaaywatch-production` with `DATABASE_SNAPSHOT_IDENTIFIER` set to that snapshot ID so the target RDS instance starts from the same published snapshot and run history.
   - Sync the current production artifacts bucket into the `nyaaywatch-production` artifacts bucket after the target stack exists.
   - Verify public pages and operator replay/rollback against the target ALB before DNS.
   - This is the cleanest environment split and avoids future replay failures from missing S3 artifacts.

2. **Temporary bridge: share the current production database secret.**
   - Deploy `nyaaywatch-production` with `EXISTING_DATABASE_URL_SECRET_ARN` pointing at the current production `DatabaseUrlSecretArn`.
   - Do not enable target schedules before DNS.
   - This can verify the app and ALB quickly, but it is not the final clean split because old run artifacts still live in the legacy bucket while the target stack gets a new bucket.
   - Treat this as a bridge only if a database clone is too slow for the cutover window.

Do not proceed without recording which path is being used.

For the preferred path, treat the RDS snapshot as a maintenance-window boundary. Do not run new production publishes, replay, rollback, or publish-pending work between the final snapshot and DNS cutover unless you intentionally abandon that snapshot and take a fresh one. Scheduled internal fetches do not publish public data by themselves, but they can create new run artifacts; keep the cutover window tight so the target database and copied artifacts remain aligned.

Create and wait for the manual snapshot:

```bash
aws rds create-db-snapshot \
  --region ap-south-1 \
  --db-instance-identifier '<current-production-database-instance-identifier>' \
  --db-snapshot-identifier '<nyaaywatch-prod-cutover-YYYYMMDD-HHMM>'

aws rds wait db-snapshot-available \
  --region ap-south-1 \
  --db-snapshot-identifier '<nyaaywatch-prod-cutover-YYYYMMDD-HHMM>'
```

The current database instance identifier is printed by `npm run infra:production-cutover-inventory`.

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
export DATABASE_SNAPSHOT_IDENTIFIER='<nyaaywatch-prod-cutover-YYYYMMDD-HHMM>'
export STACK_DATABASE_ALLOCATED_STORAGE='<snapshot-allocated-storage-gib-or-larger>'
export SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true

./infra/aws/staging/deploy-stack.sh \
  nyaaywatch-production \
  '<current-production-image-uri>' \
  '<target-operator-token>' \
  '<source-database-password-until-post-cutover-rotation>' \
  '<certificate-arn>' \
  '[alarm-email]'
```

When restoring from an RDS snapshot, AWS inherits the database name and master username from the source database. The `deploy-stack.sh` database-password argument is still used for the generated `DATABASE_URL` secret, so it must match the restored database password until a deliberate post-cutover password rotation updates both RDS and Secrets Manager together.

`SNAPSHOT_DATABASE_PASSWORD_CONFIRMED=true` is required because AWS does not apply the `deploy-stack.sh` password argument to an RDS instance restored from a snapshot. The flag means the password argument already matches the restored database and is safe to write into the generated `DATABASE_URL` secret.

The deploy helper verifies the snapshot `MasterUsername` and allocated storage through `aws rds describe-db-snapshots`, then verifies the database name from snapshot metadata or from the source DB instance after requiring and matching the snapshot's immutable `DbiResourceId`. The normal NyaayWatch values are `STACK_DATABASE_NAME=nyaaywatch` and `STACK_DATABASE_USERNAME=nyaaywatch`; set those stack-specific environment variables only if you intentionally restore a snapshot with different values and want the generated secret to match it. Set `STACK_DATABASE_ALLOCATED_STORAGE` to at least the snapshot's allocated storage size when restoring. The template omits `EngineVersion` during snapshot restore so RDS can use the snapshot's own PostgreSQL version.

CloudFormation requires the same `DatabaseSnapshotIdentifier` to remain on later updates to a DB instance that was created from a snapshot. The deploy helper preserves the existing stack parameters for snapshot ID, database name, database username, and allocated storage during later deploys, refuses to add snapshot restore to an already-existing non-snapshot stack, and refuses a different snapshot ID unless `ALLOW_DATABASE_SNAPSHOT_REPLACEMENT=true` is set for a deliberate database replacement. It also refuses explicit DB name or username changes on snapshot-backed stack updates unless `ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE=true` is set. On initial snapshot deploys, it verifies the snapshot master username and allocated storage and verifies the DB name from snapshot metadata or, for PostgreSQL snapshots where AWS omits `DBName`, from the source DB instance only when the snapshot exposes an immutable `DbiResourceId` and the current source instance still matches that snapshot lineage. It only calls `describe-db-snapshots` when `DATABASE_SNAPSHOT_IDENTIFIER` is explicitly supplied, so normal post-cutover deploys do not depend on retaining the original manual snapshot record forever.

If using the temporary shared-database bridge, add:

```bash
export EXISTING_DATABASE_URL_SECRET_ARN='<current-production-database-url-secret-arn>'
```

Do not set both `DATABASE_SNAPSHOT_IDENTIFIER` and `EXISTING_DATABASE_URL_SECRET_ARN`; the deploy helper refuses that mixed path.

Use a separate target operator token unless there is a deliberate reason to share the current one.

After the target stack exists, copy the artifacts bucket:

```bash
aws s3 sync \
  s3://<current-production-artifacts-bucket> \
  s3://<target-production-artifacts-bucket> \
  --exact-timestamps
```

The target artifacts bucket is available from the `ArtifactsBucketName` CloudFormation output on `nyaaywatch-production`.

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

1. Confirm `docs/internal/DEPLOYMENT_STATUS.md` still points production at `nyaaywatch-production`.
2. Confirm `.github/workflows/ci.yml` and `.github/workflows/ops-watchdog.yml` still use `PRODUCTION_STACK_NAME=nyaaywatch-production`.
3. Confirm the staging certificate path. As of `2026-04-29`, ACM certificate `arn:aws:acm:ap-south-1:723951822728:certificate/12a69434-d2e6-4a6f-a42e-d7bf64797870` has been requested for `staging.nyaaywatch.in`, but it is still `PENDING_VALIDATION` until DNS CNAME `_b4abab057857a0342d4553f922f29c5d.staging.nyaaywatch.in` -> `_c1add49c9a68fbf56bdbbd26190ede9f.jkddzztszm.acm-validations.aws` is created.
4. Retire, snapshot, or rename the legacy `nyaaywatch-staging` production resources after accepting that rollback would no longer be DNS-first to the old stack.
5. Provision a dedicated staging stack named `nyaaywatch-staging` with isolated RDS, S3, Secrets Manager values, schedules, dashboard, and alarm topic.
6. Update `TODOS.md` and release history with the retirement/reclaim evidence.

## Current Cutover State

The April 28, 2026 cutover used the preferred isolated data path:

- manual RDS snapshot `nyaaywatch-prod-cutover-20260428-0019`
- restored `nyaaywatch-production` database and synced production artifacts bucket
- Cloudflare DNS for `nyaaywatch.in` points at `nyaaywatch-production-874934657.ap-south-1.elb.amazonaws.com`
- `npm run release:verify -- --base-url=https://nyaaywatch.in` passed through normal DNS
- production schedules exist under `nyaaywatch-production-*` and target the live deploy-managed `nyaaywatch-production:<revision>` task definition
- post-deploy observation at `2026-04-28T04:44:43.046Z` confirmed production health, public release verification, alarm state, and schedule alignment remained green; the schedules targeted `nyaaywatch-production:6` at that check

Post-cutover observation on `2026-04-29T00:51:30Z` was green:

- `ALLOW_EXISTING_TARGET_STACK=true npm run infra:production-preflight` passed with both stacks in `UPDATE_COMPLETE`
- `npm run release:verify -- --base-url=https://nyaaywatch.in` passed through normal DNS
- `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` reported `62/62` healthy targets, no stale snapshots, no daily-fetch lag, and no failures
- `npm run ops:verify-internal-fetch-schedule -- --base-url=https://nyaaywatch.in --stack-name=nyaaywatch-production` showed every production schedule targeting `nyaaywatch-production:11`
- production CloudWatch alarms `nyaaywatch-production-health-endpoint`, `nyaaywatch-production-alb-target-5xx`, `nyaaywatch-production-app-errors`, and `nyaaywatch-production-public-alpha-ops` were `OK`

The remaining work is destructive rollback-stack retirement or rename, staging certificate readiness, and reclaiming `nyaaywatch-staging` for dedicated staging.
