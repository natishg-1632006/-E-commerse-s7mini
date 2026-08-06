# ==============================================================================
# Input Variables for Natish E-Commerce Infrastructure
# ==============================================================================

# AWS deployment region (Default: ap-southeast-1)
variable "aws_region" {
  description = "AWS target region for all infrastructure resources"
  type        = string
  default     = "ap-southeast-1"
}

# Target environment identifier (e.g., prod, dev, staging)
variable "environment" {
  description = "Deployment environment name for tagging and resource management"
  type        = string
  default     = "prod"
}

# Core project naming prefix used for resource identification
variable "project_name" {
  description = "Primary project prefix used across all AWS resources (natish)"
  type        = string
  default     = "natish"
}

# S3 Bucket name for hosting static frontend build assets
variable "frontend_bucket_name" {
  description = "Target S3 bucket name hosting the React/Vite frontend (natish-frontend)"
  type        = string
  default     = "natish-frontend"
}
