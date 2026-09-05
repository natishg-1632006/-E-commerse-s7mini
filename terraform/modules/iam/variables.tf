# ==============================================================================
# Input Variables for IAM Deployment User Module
# ==============================================================================

variable "project_name" {
  description = "Project naming prefix used for resource identification"
  type        = string
  default     = "natish"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
  default     = "prod"
}
