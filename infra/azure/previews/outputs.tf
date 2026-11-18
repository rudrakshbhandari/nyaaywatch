output "resource_group_name" {
  value = azurerm_resource_group.preview.name
}

output "container_app_environment_name" {
  value = azurerm_container_app_environment.preview.name
}

output "container_registry_login_server" {
  value = azurerm_container_registry.preview.login_server
}

output "deploy_identity_client_id" {
  value = azurerm_user_assigned_identity.deploy.client_id
}
