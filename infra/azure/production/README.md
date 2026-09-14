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
the container app is deployed. Email delivery, alarms, and production DNS
remain deliberately outside this target until the application and data paths
have been validated in parallel with AWS.

The scheduled jobs use UTC equivalents of the current Asia/Kolkata cadence:

- lower-court fetch at 08:00 IST
- Supreme Court fetch at 08:10 IST
- reviewed High Court fetch at 08:20 IST
- publish-pending sweep at 08:30 IST
- public-alpha monitor every 30 minutes

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

`ALLOW_TARGET_OVERWRITE=true` is an explicit destructive exception and should
only be used after a target backup and recorded cutover approval. The AWS
source remains untouched by this operation.
