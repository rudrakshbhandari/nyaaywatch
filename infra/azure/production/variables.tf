variable "subscription_id" {
  description = "Azure subscription that owns the NyaayWatch target environment."
  type        = string
}

variable "project_name" {
  description = "Lowercase Azure resource prefix."
  type        = string
  default     = "nyaaywatch"
}

variable "environment_name" {
  description = "Environment suffix used in resource names and tags."
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region for the initial migration target."
  type        = string
  default     = "centralindia"
}

variable "container_image" {
  description = "Fully-qualified image in the target Azure Container Registry."
  type        = string
}

variable "database_admin_password" {
  description = "PostgreSQL administrator password supplied through an uncommitted tfvars file or CI secret."
  type        = string
  sensitive   = true
}

variable "operator_api_token" {
  description = "NyaayWatch operator API token."
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare token used for cache invalidation."
  type        = string
  sensitive   = true
  default     = null
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone used for cache invalidation."
  type        = string
  default     = null
}

variable "public_base_url" {
  description = "Canonical public URL used by the operations monitor and release helpers."
  type        = string
  default     = "https://nyaaywatch.in"
}

variable "canonical_host" {
  description = "Canonical hostname used by the application for legacy-host redirects."
  type        = string
  default     = "nyaaywatch.in"
}

variable "legacy_hosts" {
  description = "Comma-separated legacy hostnames that redirect to canonical_host."
  type        = string
  default     = "nyaaywatch.com,www.nyaaywatch.com"
}

variable "manage_public_hostname" {
  description = "Manage the canonical public hostname binding in Terraform after the Azure validation records exist. Import an existing binding before enabling this flag."
  type        = bool
  default     = false
}

variable "azure_communication_connection_string" {
  description = "Azure Communication Services email connection string. Keep in protected CI variables or an untracked tfvars file."
  type        = string
  sensitive   = true
  default     = null
}

variable "azure_email_sender" {
  description = "Verified Azure Communication Services sender address."
  type        = string
  default     = null
}

variable "alarm_email_to" {
  description = "Email recipient for Azure production alarm notifications."
  type        = string
  default     = null
}

variable "alarm_webhook_url" {
  description = "Optional HTTPS inbound webhook endpoint that accepts the application's alarm POST payloads. Azure Monitor Action Group webhooks are outbound destinations and are not valid here."
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_scheduled_jobs" {
  description = "Create active Azure schedule jobs. Keep false until AWS writers are stopped and cutover is approved."
  type        = bool
  default     = false
}

variable "enable_application" {
  description = "Run an application replica. Keep false until the target database and artifacts have been restored."
  type        = bool
  default     = false
}

variable "container_cpu" {
  description = "Container Apps vCPU allocation."
  type        = number
  default     = 0.5
}

variable "container_memory" {
  description = "Container Apps memory allocation."
  type        = string
  default     = "1Gi"
}
