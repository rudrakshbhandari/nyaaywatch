locals {
  name = "${var.project_name}-${var.environment_name}"

  # Azure Container Apps Job cron expressions are UTC. These preserve the
  # current Asia/Kolkata cadence: 08:00, 08:10, 08:20, and 08:30 IST.
  scheduled_jobs = {
    weekday-internal-fetch = {
      name                 = "fetch"
      cron                 = "30 2 * * *"
      command              = ["node", "dist/src/dev/ecs-scheduled-fetch-entrypoint.js"]
      args                 = []
      replica_timeout      = 14400
    }
    supreme-court-internal-fetch = {
      name            = "sc-fetch"
      cron            = "40 2 * * *"
      command         = ["node", "dist/src/dev/ecs-scheduled-supreme-court-fetch-entrypoint.js"]
      args            = []
      replica_timeout = 3600
    }
    high-courts-internal-fetch = {
      name            = "hc-fetch"
      cron            = "50 2 * * *"
      command         = ["node", "dist/src/dev/ecs-scheduled-high-court-fetch-entrypoint.js"]
      args            = []
      replica_timeout = 3600
    }
    publish-pending-sweep = {
      name            = "publish"
      cron            = "0 3 * * *"
      command         = ["node", "dist/src/dev/ecs-publish-pending-entrypoint.js"]
      args            = []
      replica_timeout = 3600
    }
    public-alpha-ops-monitor = {
      name            = "alpha-ops"
      cron            = "0 * * * *"
      command         = ["node", "dist/src/dev/ecs-public-alpha-ops-entrypoint.js"]
      args            = ["--base-url", "https://nyaaywatch.in", "--target-set", "smoke"]
      replica_timeout = 3600
    }
  }

  legacy_hostname_list = [
    for host in split(",", var.legacy_hosts) : trimspace(host)
    if trimspace(host) != "" && trimspace(host) != var.canonical_host
  ]

  public_hostnames = toset(concat([var.canonical_host], local.legacy_hostname_list))

  tags = {
    project = var.project_name
    env     = var.environment_name
  }
}

resource "azurerm_resource_group" "this" {
  name     = local.name
  location = var.location
  tags     = local.tags
}

resource "azurerm_virtual_network" "this" {
  name                = "${local.name}-vnet"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  address_space       = ["10.60.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "container_apps" {
  name                 = "container-apps"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = ["10.60.0.0/23"]

  delegation {
    name = "container-apps-delegation"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "postgres" {
  name                 = "postgres"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = ["10.60.2.0/28"]

  delegation {
    name = "postgres-delegation"

    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${local.name}-postgres-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.this.id
  resource_group_name   = azurerm_resource_group.this.name
  tags                  = local.tags
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                          = replace(local.name, "-", "")
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  version                       = "16"
  zone                          = "3"
  delegated_subnet_id           = azurerm_subnet.postgres.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  administrator_login           = "nyaaywatch"
  administrator_password        = var.database_admin_password
  storage_mb                    = 32768
  sku_name                      = "B_Standard_B1ms"
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = false
  tags                          = local.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.project_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_storage_account" "this" {
  name                            = substr(replace(local.name, "-", ""), 0, 24)
  resource_group_name             = azurerm_resource_group.this.name
  location                        = azurerm_resource_group.this.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  # azurerm_storage_container currently uses the account key for its data-plane
  # create/read path. The application still authenticates with managed identity;
  # keep public access disabled and do not distribute this key to workloads.
  shared_access_key_enabled = true
  tags                      = local.tags
}

resource "azurerm_storage_container" "artifacts" {
  name                  = "artifacts"
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "${local.name}-logs"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_container_registry" "this" {
  name                          = replace(local.name, "-", "")
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  sku                           = "Basic"
  admin_enabled                 = false
  public_network_access_enabled = true
  tags                          = local.tags
}

resource "azurerm_container_app_environment" "this" {
  name                           = "${local.name}-apps"
  location                       = azurerm_resource_group.this.location
  resource_group_name            = azurerm_resource_group.this.name
  infrastructure_subnet_id       = azurerm_subnet.container_apps.id
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.this.id
  internal_load_balancer_enabled = false
  tags                           = local.tags
}

resource "azurerm_user_assigned_identity" "container_app" {
  name                = "${local.name}-app-identity"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.this.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.container_app.principal_id
}

resource "azurerm_role_assignment" "blob_contributor" {
  scope                = azurerm_storage_account.this.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.container_app.principal_id
}

resource "azurerm_container_app" "this" {
  name                         = local.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_app.id]
  }

  registry {
    server   = azurerm_container_registry.this.login_server
    identity = azurerm_user_assigned_identity.container_app.id
  }

  secret {
    name  = "database-url"
    value = "postgresql://${azurerm_postgresql_flexible_server.this.administrator_login}:${urlencode(var.database_admin_password)}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
  }

  secret {
    name  = "operator-api-token"
    value = var.operator_api_token
  }

  dynamic "secret" {
    for_each = coalesce(var.cloudflare_api_token, "") == "" ? [] : [var.cloudflare_api_token]

    content {
      name  = "cloudflare-api-token"
      value = secret.value
    }
  }

  dynamic "secret" {
    for_each = coalesce(var.azure_communication_connection_string, "") == "" ? [] : [var.azure_communication_connection_string]

    content {
      name  = "azure-communication-connection-string"
      value = secret.value
    }
  }

  dynamic "secret" {
    for_each = var.alarm_webhook_url == null ? [] : [var.alarm_webhook_url]

    content {
      name  = "alarm-webhook-url"
      value = secret.value
    }
  }

  ingress {
    external_enabled = var.enable_application
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.enable_application ? 1 : 0
    max_replicas = var.enable_application ? 2 : 1

    container {
      name   = var.project_name
      image  = var.container_image
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "STORAGE_PROVIDER"
        value = "azure"
      }

      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.container_app.client_id
      }

      env {
        name  = "AZURE_STORAGE_ACCOUNT_URL"
        value = azurerm_storage_account.this.primary_blob_endpoint
      }

      env {
        name  = "AZURE_STORAGE_CONTAINER"
        value = azurerm_storage_container.artifacts.name
      }

      env {
        name  = "DEPLOY_ENV"
        value = var.environment_name
      }

      env {
        name  = "RUNTIME_REGION"
        value = var.location
      }

      env {
        name  = "EMAIL_PROVIDER"
        value = "azure"
      }

      dynamic "env" {
        for_each = coalesce(var.azure_communication_connection_string, "") == "" ? [] : [var.azure_communication_connection_string]

        content {
          name        = "AZURE_COMMUNICATION_CONNECTION_STRING"
          secret_name = "azure-communication-connection-string"
        }
      }

      dynamic "env" {
        for_each = coalesce(var.azure_email_sender, "") == "" ? [] : [var.azure_email_sender]

        content {
          name  = "AZURE_EMAIL_SENDER"
          value = env.value
        }
      }

      dynamic "env" {
        for_each = coalesce(var.alarm_webhook_url, "") == "" ? [] : [var.alarm_webhook_url]

        content {
          name        = "ALARM_WEBHOOK_URL"
          secret_name = "alarm-webhook-url"
        }
      }

      env {
        name        = "OPERATOR_API_TOKEN"
        secret_name = "operator-api-token"
      }

      dynamic "env" {
        for_each = coalesce(var.cloudflare_api_token, "") == "" ? [] : [var.cloudflare_api_token]

        content {
          name        = "CLOUDFLARE_API_TOKEN"
          secret_name = "cloudflare-api-token"
        }
      }

      env {
        name  = "PUBLIC_BASE_URL"
        value = var.public_base_url
      }

      env {
        name  = "CANONICAL_HOST"
        value = var.canonical_host
      }

      env {
        name  = "LEGACY_HOSTS"
        value = var.legacy_hosts
      }

      dynamic "env" {
        for_each = var.cloudflare_zone_name == null ? [] : [var.cloudflare_zone_name]

        content {
          name  = "CLOUDFLARE_ZONE_NAME"
          value = env.value
        }
      }
    }
  }

  depends_on = [azurerm_role_assignment.acr_pull, azurerm_role_assignment.blob_contributor]
}

resource "azurerm_container_app_custom_domain" "public" {
  for_each = var.manage_public_hostname ? local.public_hostnames : toset([])

  name             = each.value
  container_app_id = azurerm_container_app.this.id

  # Azure provisions and renews the managed certificate asynchronously after
  # DNS validation. Keep those API-populated fields out of Terraform's diff.
  lifecycle {
    ignore_changes = [
      certificate_binding_type,
      container_app_environment_certificate_id,
    ]
  }
}

resource "azurerm_container_app_job" "scheduled" {
  for_each = var.enable_scheduled_jobs ? local.scheduled_jobs : {}

  name                         = "${local.name}-${each.value.name}"
  location                     = azurerm_resource_group.this.location
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  replica_timeout_in_seconds   = each.value.replica_timeout
  replica_retry_limit          = 1
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_app.id]
  }

  registry {
    server   = azurerm_container_registry.this.login_server
    identity = azurerm_user_assigned_identity.container_app.id
  }

  schedule_trigger_config {
    cron_expression          = each.value.cron
    parallelism              = 1
    replica_completion_count = 1
  }

  secret {
    name  = "database-url"
    value = "postgresql://${azurerm_postgresql_flexible_server.this.administrator_login}:${urlencode(var.database_admin_password)}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
  }

  secret {
    name  = "operator-api-token"
    value = var.operator_api_token
  }

  dynamic "secret" {
    for_each = coalesce(var.cloudflare_api_token, "") == "" ? [] : [var.cloudflare_api_token]

    content {
      name  = "cloudflare-api-token"
      value = secret.value
    }
  }

  dynamic "secret" {
    for_each = coalesce(var.azure_communication_connection_string, "") == "" ? [] : [var.azure_communication_connection_string]

    content {
      name  = "azure-communication-connection-string"
      value = secret.value
    }
  }

  dynamic "secret" {
    for_each = coalesce(var.alarm_webhook_url, "") == "" ? [] : [var.alarm_webhook_url]

    content {
      name  = "alarm-webhook-url"
      value = secret.value
    }
  }

  template {
    container {
      name    = each.key
      image   = var.container_image
      cpu     = var.container_cpu
      memory  = var.container_memory
      command = each.value.command
      args    = each.value.args

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "STORAGE_PROVIDER"
        value = "azure"
      }

      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.container_app.client_id
      }

      env {
        name  = "AZURE_STORAGE_ACCOUNT_URL"
        value = azurerm_storage_account.this.primary_blob_endpoint
      }

      env {
        name  = "AZURE_STORAGE_CONTAINER"
        value = azurerm_storage_container.artifacts.name
      }

      env {
        name  = "DEPLOY_ENV"
        value = var.environment_name
      }

      env {
        name  = "RUNTIME_REGION"
        value = var.location
      }

      env {
        name  = "EMAIL_PROVIDER"
        value = "azure"
      }

      dynamic "env" {
        for_each = var.azure_communication_connection_string == null ? [] : [var.azure_communication_connection_string]

        content {
          name        = "AZURE_COMMUNICATION_CONNECTION_STRING"
          secret_name = "azure-communication-connection-string"
        }
      }

      dynamic "env" {
        for_each = var.azure_email_sender == null ? [] : [var.azure_email_sender]

        content {
          name  = "AZURE_EMAIL_SENDER"
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.alarm_webhook_url == null ? [] : [var.alarm_webhook_url]

        content {
          name        = "ALARM_WEBHOOK_URL"
          secret_name = "alarm-webhook-url"
        }
      }

      env {
        name        = "OPERATOR_API_TOKEN"
        secret_name = "operator-api-token"
      }

      env {
        name  = "PUBLIC_BASE_URL"
        value = var.public_base_url
      }

      env {
        name  = "AWS_REGION"
        value = "ap-south-1"
      }

      dynamic "env" {
        for_each = coalesce(var.cloudflare_api_token, "") == "" ? [] : [var.cloudflare_api_token]

        content {
          name        = "CLOUDFLARE_API_TOKEN"
          secret_name = "cloudflare-api-token"
        }
      }

      dynamic "env" {
        for_each = var.cloudflare_zone_name == null ? [] : [var.cloudflare_zone_name]

        content {
          name  = "CLOUDFLARE_ZONE_NAME"
          value = env.value
        }
      }
    }
  }

  depends_on = [azurerm_role_assignment.acr_pull, azurerm_role_assignment.blob_contributor]
}
