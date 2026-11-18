variable "subscription_id" {
  description = "Azure subscription that owns the isolated preview environment."
  type        = string
}

variable "location" {
  description = "Azure region for preview resources."
  type        = string
  default     = "centralindia"
}
