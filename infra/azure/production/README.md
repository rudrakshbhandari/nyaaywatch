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

The application must be switched to the Azure artifact-store adapter before
the container app is deployed. Scheduled operator jobs, email delivery,
alarms, and production DNS remain deliberately outside this first target so
the migration can be validated in parallel with AWS.

## Plan-only validation

```bash
terraform init
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars
```

Never commit `terraform.tfvars` or a Terraform state file. Supply database and
operator secrets through a protected CI variable or an untracked local file.
