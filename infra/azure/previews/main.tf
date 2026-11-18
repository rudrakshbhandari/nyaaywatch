terraform {
  backend "azurerm" {}

  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

locals {
  tags = {
    project = "nyaaywatch"
    env     = "preview"
  }
}

resource "azurerm_resource_group" "preview" {
  name     = "nyaaywatch-previews"
  location = var.location
  tags     = local.tags
}

resource "azurerm_log_analytics_workspace" "preview" {
  name                = "nyaaywatch-previews-logs"
  location            = azurerm_resource_group.preview.location
  resource_group_name = azurerm_resource_group.preview.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_container_registry" "preview" {
  name                          = "nyaaywatchpreview"
  resource_group_name           = azurerm_resource_group.preview.name
  location                      = azurerm_resource_group.preview.location
  sku                           = "Basic"
  admin_enabled                 = false
  public_network_access_enabled = true
  tags                          = local.tags
}

resource "azurerm_container_app_environment" "preview" {
  name                       = "nyaaywatch-previews-apps"
  location                   = azurerm_resource_group.preview.location
  resource_group_name        = azurerm_resource_group.preview.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.preview.id
  tags                       = local.tags

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
    minimum_count         = 0
    maximum_count         = 0
  }
}

resource "azurerm_user_assigned_identity" "deploy" {
  name                = "nyaaywatch-preview-deploy"
  location            = azurerm_resource_group.preview.location
  resource_group_name = azurerm_resource_group.preview.name
  tags                = local.tags
}

resource "azurerm_federated_identity_credential" "github_main_workflow" {
  name                      = "github-main-workflows"
  user_assigned_identity_id = azurerm_user_assigned_identity.deploy.id
  audience                  = ["api://AzureADTokenExchange"]
  issuer                    = "https://token.actions.githubusercontent.com"
  subject                   = "repo:rudrakshbhandari/nyaaywatch:ref:refs/heads/main"
}

resource "azurerm_role_assignment" "deploy_contributor" {
  scope                = azurerm_resource_group.preview.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.deploy.principal_id
}

resource "azurerm_role_assignment" "deploy_acr_push" {
  scope                = azurerm_container_registry.preview.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.deploy.principal_id
}

resource "azurerm_role_assignment" "deploy_acr_delete" {
  scope                = azurerm_container_registry.preview.id
  role_definition_name = "AcrDelete"
  principal_id         = azurerm_user_assigned_identity.deploy.principal_id
}

resource "azurerm_user_assigned_identity" "pull" {
  name                = "nyaaywatch-preview-pull"
  location            = azurerm_resource_group.preview.location
  resource_group_name = azurerm_resource_group.preview.name
  tags                = local.tags
}

resource "azurerm_role_assignment" "pull_acr" {
  scope                = azurerm_container_registry.preview.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.pull.principal_id
}

resource "azurerm_role_assignment" "deploy_assign_pull_identity" {
  scope                = azurerm_user_assigned_identity.pull.id
  role_definition_name = "Managed Identity Operator"
  principal_id         = azurerm_user_assigned_identity.deploy.principal_id
}
