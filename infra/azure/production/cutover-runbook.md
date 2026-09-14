# NyaayWatch AWS to Azure cutover

This runbook keeps AWS available as the rollback origin until Azure has passed
the production verification gates. It is intentionally separate from the
Terraform apply workflow: provisioning and data transfer are reversible, while
DNS cutover changes the live origin.

## Before the freeze

1. Configure the protected GitHub variables/secrets documented in
   `.github/workflows/azure-migration.yml`, including a verified Azure
   Communication Services sender and an Azure Monitor Action Group webhook.
2. Run the workflow once with `apply=true`, `enable_application=false`, and
   `enable_scheduled_jobs=false`; record the Terraform outputs, PostgreSQL FQDN,
   storage account, and state backend.
3. Run the repository-provided private relay procedure: launch the temporary
   amd64 `infra/azure/production/relay.Dockerfile` image as an ECS Fargate task
   in the AWS database VPC, upload the custom-format dump and source row-count
   manifest to Azure Blob SAS URLs, and run the `restore.Dockerfile` image as a
   manual Container Apps Job in the Azure VNet. Keep the AWS database untouched
   and retain the row-count comparison output.
4. Run `migrate-artifacts.sh` against the AWS production artifact bucket and
   Azure `artifacts` container. Retain its file count, byte count, and manifest
   verification output.
5. Reapply with `enable_application=true` and
   `enable_scheduled_jobs=false`. Exercise the Azure Container App FQDN with `/health`, a public snapshot
   page, JSON data, and an operator-authenticated read-only inspection. Confirm
   that the Azure app can read the copied artifacts and connect to PostgreSQL.
6. Do not enable Azure scheduled writers during rehearsal. Keep the AWS
   schedules active because AWS remains the live origin until the final freeze.

## Cutover freeze

1. Announce a short write freeze. Run
   `MIGRATION_WRITE_FREEZE=true infra/aws/staging/redeploy-service.sh
   nyaaywatch-production <current-production-image>` (the stack parameter and
   redeploy helper pass the flag into ECS), verify mutating routes return 503,
   stop AWS scheduled writers, and confirm no fetch or publish job is running.
2. Run the private relay/restore procedure and artifact migration script again. For the
   database restore, use the approved clean-restore path (`ALLOW_TARGET_OVERWRITE=true`)
   only after confirming the write freeze and retaining the pre-restore backup.
   The restore relay honors this flag with `pg_restore --clean --if-exists`.
   Compare the source
   and target row counts, file counts, bytes, and application snapshot hashes.
3. Rerun both migration procedures. The artifact check permits target-only files
   created during rehearsal while requiring every AWS source artifact to be
   present and checksum-identical.
4. Apply Terraform with `enable_application = true` and
   `enable_scheduled_jobs = true`, then start the Azure jobs and perform one
   manual fetch/publish smoke test. Check
   the Azure logs and alarm webhook.
5. Configure and verify a Cloudflare Origin Rule that rewrites both the origin
   Host header and TLS SNI to the stable Azure Container App ingress FQDN, then
   change the Cloudflare origin/DNS record. The public hostname remains visible
   to clients at the edge, while the Azure ingress receives its routable host.
   Keep the AWS origin configuration intact.
6. Verify through the public hostname from an external network: health,
   canonical redirect, one public state page, JSON data, newsletter subscribe
   confirmation path, and operator health/read-only inspection.

## Rollback

If any verification gate fails, stop Azure scheduled writers, restore the
Cloudflare origin to the AWS load balancer, redeploy AWS with
`MIGRATION_WRITE_FREEZE=false`, re-enable the AWS schedules, and verify the
public hostname again. If Azure accepted writes after cutover, export and
review those Azure database rows and Blob objects before rollback; do not
silently roll back over them. Do not delete Azure resources or overwrite the
Azure database while investigating. Record the failing check, timestamp, image
SHA, and last successful AWS release.

Only after a separately approved stabilization period should AWS be retired.
