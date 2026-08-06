variable "aws_region" {
  description = "AWS region for all infrastructure resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Name of the project used for tagging and resource naming"
  type        = string
  default     = "natish"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket hosting the static frontend"
  type        = string
  default     = "natish-frontend"
}
