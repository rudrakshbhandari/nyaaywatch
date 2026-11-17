# Azure production deployment

Azure is the selected production provider. GitHub's `ACTIVE_PRODUCTION_PROVIDER`
repository variable is set to `azure`; `.github/workflows/azure-migration.yml`
handles verification and Azure deployment on `main` pushes. The AWS production
deployment job in `.github/workflows/ci.yml` runs only when the provider is not
Azure.

## Source of configuration

- `main.tf`, `variables.tf`, and related Terraform files define the Container
  App, PostgreSQL Flexible Server, Blob Storage, Container Registry, networking,
  logging, and scheduled Container Apps Jobs.
- `.github/workflows/azure-migration.yml` authenticates through GitHub OIDC,
  initializes the remote Terraform state, plans/applies the configured stack,
  and deploys the application image.
- GitHub Actions secrets provide Azure identity, database, operator, and
  notification credentials. Keep credentials and Terraform state out of Git.

## Deployment and verification

Normal production deploys follow successful checks on `main`. For a manual
deployment or infrastructure change, use the workflow's `workflow_dispatch`
inputs and review the Terraform plan before applying. Keep scheduled writers,
application replicas, and public hostname management disabled for rehearsal
applies unless the change is an approved production operation.

After deployment, verify the public hostname and health route, run
`npm run release:verify -- --base-url=https://nyaaywatch.in`, and check the
Azure Container Apps Job outcomes and application logs. Use
`npm run operator:remote -- --base-url=https://nyaaywatch.in publications`
for a read-only operator check.

## Local Terraform checks

```bash
terraform -chdir=infra/azure/production fmt -check
terraform -chdir=infra/azure/production validate
```

Do not commit `terraform.tfvars`, state files, credentials, database URLs, or
time-limited storage tokens. Record release evidence in
`docs/internal/RELEASE_HISTORY.md` and keep the current environment map in
`docs/internal/DEPLOYMENT_STATUS.md`.
