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
