output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "container_registry_login_server" {
  value = azurerm_container_registry.this.login_server
}

output "container_app_fqdn" {
  value = azurerm_container_app.this.ingress[0].fqdn
}

output "container_app_latest_revision_fqdn" {
  value = azurerm_container_app.this.latest_revision_fqdn
}

output "public_hostname" {
  value = "nyaaywatch.in"
}

output "storage_account_name" {
  value = azurerm_storage_account.this.name
}

output "storage_container_name" {
  value = azurerm_storage_container.artifacts.name
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.this.fqdn
}

output "scheduled_job_names" {
  value = sort([for job in azurerm_container_app_job.scheduled : job.name])
}
