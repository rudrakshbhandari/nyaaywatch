# Adopt Azure resources that were created before Terraform state was initialized.
# Importing is a no-op for addresses already present in the state.
import {
  for_each = var.enable_scheduled_jobs ? local.scheduled_jobs : {}

  to = azurerm_container_app_job.scheduled[each.key]
  id = "/subscriptions/${var.subscription_id}/resourceGroups/${local.name}/providers/Microsoft.App/jobs/${local.name}-${each.value.name}"
}

import {
  for_each = var.manage_public_hostname ? toset([var.canonical_host]) : toset([])

  to = azurerm_container_app_custom_domain.public[each.key]
  id = "${azurerm_container_app.this.id}/customDomainName/${each.key}"
}
