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

The deploy helper verifies the snapshot `MasterUsername` and allocated storage through `aws rds describe-db-snapshots`, then verifies the database name from snapshot metadata or the source DB instance before it generates the target `DATABASE_URL` secret. The normal NyaayWatch values are `STACK_DATABASE_NAME=nyaaywatch` and `STACK_DATABASE_USERNAME=nyaaywatch`; set those stack-specific environment variables only if you intentionally restore a snapshot with different values and want the generated secret to match it. Set `STACK_DATABASE_ALLOCATED_STORAGE` to at least the snapshot's allocated storage size when restoring. The template omits `EngineVersion` during snapshot restore so RDS can use the snapshot's own PostgreSQL version.

CloudFormation requires the same `DatabaseSnapshotIdentifier` to remain on later updates to a DB instance that was created from a snapshot. The deploy helper preserves the existing stack parameters for snapshot ID, database name, database username, and allocated storage during later deploys, refuses to add snapshot restore to an already-existing non-snapshot stack, and refuses a different snapshot ID unless `ALLOW_DATABASE_SNAPSHOT_REPLACEMENT=true` is set for a deliberate database replacement. It also refuses explicit DB name or username changes on snapshot-backed stack updates unless `ALLOW_SNAPSHOT_DATABASE_IDENTITY_CHANGE=true` is set. On initial snapshot deploys, it verifies the snapshot master username and allocated storage and verifies the DB name from snapshot metadata or, for PostgreSQL snapshots where AWS omits `DBName`, from the source DB instance. It only calls `describe-db-snapshots` when `DATABASE_SNAPSHOT_IDENTIFIER` is explicitly supplied, so normal post-cutover deploys do not depend on retaining the original manual snapshot record forever.

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
