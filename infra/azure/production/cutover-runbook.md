# NyaayWatch AWS to Azure cutover

This runbook keeps AWS available as the rollback origin until Azure has passed
the production verification gates. It is intentionally separate from the
Terraform apply workflow: provisioning and data transfer are reversible, while
DNS cutover changes the live origin.

## Before the freeze

1. Configure the protected GitHub variables/secrets documented in
   `.github/workflows/azure-migration.yml`, including a verified Azure
   Communication Services sender and an Azure Monitor Action Group webhook.
2. Run the workflow once with `apply=true`; record the image SHA, Terraform
   outputs, Container App FQDN, PostgreSQL FQDN, storage account, and job names.
3. Run `migrate-postgres.sh` against the AWS production database and the Azure
   database. Keep the AWS database untouched and retain the row-count output.
4. Run `migrate-artifacts.sh` against the AWS production artifact bucket and
   Azure `artifacts` container. Retain its file count, byte count, and manifest
   verification output.
5. Exercise the Azure Container App FQDN with `/health`, a public snapshot
   page, JSON data, and an operator-authenticated read-only inspection. Confirm
   that the Azure app can read the copied artifacts and connect to PostgreSQL.
6. Trigger each Container Apps Job once from Azure and confirm successful
   completion without enabling equivalent AWS and Azure writers at the same
   time. The schedule remains disabled on AWS until the final switch.

## Cutover freeze

1. Announce a short write freeze. Stop AWS scheduled writers and confirm no
   fetch or publish job is running.
2. Run the PostgreSQL and artifact migration scripts again. Compare the source
   and target row counts, file counts, bytes, and application snapshot hashes.
3. Apply Terraform with `enable_scheduled_jobs = true`, then start the Azure
   jobs and perform one manual fetch/publish smoke test. Check
   the Azure logs and alarm webhook.
4. Change the Cloudflare origin/DNS record for `nyaaywatch.in` to the verified
   Azure Container App endpoint. Keep the AWS origin configuration intact.
5. Verify through the public hostname from an external network: health,
   canonical redirect, one public state page, JSON data, newsletter subscribe
   confirmation path, and operator health/read-only inspection.

## Rollback

If any verification gate fails, stop Azure scheduled writers, restore the
Cloudflare origin to the AWS load balancer, re-enable the AWS schedules, and
verify the public hostname again. Do not delete Azure resources or overwrite
the Azure database while investigating. Record the failing check, timestamp,
image SHA, and last successful AWS release.

Only after a separately approved stabilization period should AWS be retired.
