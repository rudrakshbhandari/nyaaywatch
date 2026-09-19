# NyaayWatch Azure production target

This Terraform target is the first migration stage from the current AWS
CloudFormation stack. It provisions the durable Azure substrate without
changing the live AWS environment:

- Azure Container Apps for the Dockerized application.
- Azure Database for PostgreSQL Flexible Server on a delegated private subnet.
- Azure Blob Storage for raw artifacts and release evidence.
- Azure Container Registry with managed-identity image pulls.
- Azure Log Analytics for container logs.
- A private virtual network and private DNS zone for PostgreSQL.
- Azure Container Apps Jobs for the five existing fetch, publish, and smoke-monitor cadences.

The application must be switched to the Azure artifact-store adapter before
the container app is deployed. The target supports Azure Communication Services
email and an optional HTTPS alarm webhook; provide the verified sender,
connection string, and webhook before cutover if newsletter delivery and
failure paging are required. Production DNS remains outside this target until
the application and data paths have been validated in parallel with AWS.

The scheduled jobs use UTC equivalents of the current Asia/Kolkata cadence:

- lower-court fetch at 08:00 IST
- Supreme Court fetch at 08:10 IST
- reviewed High Court fetch at 08:20 IST
- publish-pending sweep at 08:30 IST
- public-alpha monitor hourly

Scheduled jobs are disabled by default. Set `enable_scheduled_jobs = true`
only during the approved cutover after the AWS writers are stopped; this
prevents a rehearsal Azure apply from writing alongside production AWS.

The canonical hostname binding is also opt-in because Azure requires DNS
validation before it can issue the managed certificate. After the `asuid`
validation record exists, import an existing binding (if one was created during
validation) and set `manage_public_hostname = true` for subsequent applies:

```bash
terraform import 'azurerm_container_app_custom_domain.public["nyaaywatch.in"]' \
  /subscriptions/SUBSCRIPTION_ID/resourceGroups/nyaaywatch-production/providers/Microsoft.App/containerApps/nyaaywatch-production/customDomainName/nyaaywatch.in
```

Terraform then keeps the binding attached across image deployments while Azure
continues to manage certificate issuance and renewal asynchronously.

## Plan-only validation

```bash
terraform init
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars
```

Never commit `terraform.tfvars` or a Terraform state file. Supply database and
operator secrets through a protected CI variable or an untracked local file.

## PostgreSQL transfer

The target database must be provisioned and reachable through the Azure
Container Apps VNet before transfer. The migration script keeps credentials in
environment variables, refuses to overwrite a non-empty target by default,
and compares every public-table row count after restore:

```bash
SOURCE_DATABASE_URL='postgresql://...' \
TARGET_DATABASE_URL='postgresql://...' \
./migrate-postgres.sh
```

`ALLOW_TARGET_OVERWRITE=true` is an explicit destructive exception. It enables
`pg_restore --clean --if-exists`, so take a target backup and record cutover
approval first. The AWS source remains untouched by this operation.

## Artifact transfer

Copy the raw captures and release evidence before switching the application to
Azure Blob. The script downloads the AWS bucket into a temporary directory,
uploads it to the Azure container, downloads the result again, and compares
SHA-256 manifests. It never deletes the AWS source or Azure target:

```bash
SOURCE_S3_URI='s3://nyaaywatch-production-artifacts-ACCOUNT_ID' \
TARGET_BLOB_SAS_URL='https://STORAGE.blob.core.windows.net/artifacts?SAS_TOKEN' \
./migrate-artifacts.sh
```

Use a short-lived, write-capable SAS scoped only to the target `artifacts`
container. Do not put the SAS, AWS credentials, or either database URL in a
repository file or shell history. Run this transfer again during the final
cutover freeze to capture artifacts created since the rehearsal.
