# Azure pull request previews

The preview environment is isolated from `nyaaywatch-production`. Terraform creates a dedicated resource group, Basic ACR, consumption Container Apps environment, and separate deployment and image-pull identities. The deploy identity is a Contributor only in the preview resource group, has push/delete access only to the preview registry, and can attach only the preview pull identity. Preview apps run `APP_MODE=preview`, which builds the public routes from repository fixtures and does not connect to production PostgreSQL, Blob Storage, or production secrets.

## Trust boundary

`Azure Preview Build` runs on same-repository pull requests with read-only repository access and no Azure credentials or OIDC token permission. It saves the built container as a short-lived GitHub artifact. `Azure Preview Deploy` runs from the default branch after that workflow completes, verifies the same-repository PR is still open at the same head SHA, and then transfers the image to the preview registry. It never checks out or executes PR source while Azure credentials are available. The deploy identity is federated only to the default branch subject and is limited to the preview resource group and preview ACR. Container Apps receive a distinct identity with only `AcrPull`.

The hourly reconciliation workflow removes preview apps for closed PRs. Cleanup is intentionally driven from the trusted default-branch workflow so a PR event cannot obtain an Azure token.

## Provisioning

The stack uses its own remote state key, `nyaaywatch-previews.tfstate`, in the existing `nyaaywatch-terraform-state` storage account. Initialize and apply it with an Azure identity authorized to create the preview resources and role assignments:

```sh
terraform -chdir=infra/azure/previews init \
  -backend-config="resource_group_name=nyaaywatch-terraform-state" \
  -backend-config="storage_account_name=nyaaywatchtfstate377" \
  -backend-config="container_name=terraform-state" \
  -backend-config="key=nyaaywatch-previews.tfstate" \
  -backend-config="access_key=$(az storage account keys list --resource-group nyaaywatch-terraform-state --account-name nyaaywatchtfstate377 --query '[0].value' --output tsv)" \
  -backend-config="subscription_id=$(az account show --query id --output tsv)" \
  -backend-config="tenant_id=$(az account show --query tenantId --output tsv)"

terraform -chdir=infra/azure/previews plan \
  -var="subscription_id=$(az account show --query id --output tsv)" \
  -out=previews.tfplan
terraform -chdir=infra/azure/previews apply previews.tfplan
```

Set repository variable `ENABLE_AZURE_PREVIEWS=true` and secret `AZURE_PREVIEW_CLIENT_ID` to Terraform output `deploy_identity_client_id`. The existing `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID` secrets are reused. Keep `ENABLE_AWS_PREVIEWS` unset; AWS is not part of this preview path.

Each PR app uses 0.25 vCPU, 0.5 GiB memory, zero minimum replicas, and one maximum replica. The preview registry and logging workspace incur Azure charges even when apps scale to zero. Remove the stack with `terraform destroy` only after preview apps have been removed.
