# ==============================================================================
# Main Infrastructure as Code Entrypoint for Natish E-Commerce Platform
# ==============================================================================
# This root module orchestrates all underlying microservice infrastructure modules:
# 1. DynamoDB Tables (11 production tables across all backend microservices)
# 2. S3 Frontend (Static website hosting for React/Vite web application)
# 3. CloudFront CDN (Global Distribution with SPA 403/404 routing redirects)
# 4. Cognito (User authentication pool and application client)
# 5. Event Messaging (SNS Payment events topic and 5 production SQS queues)
# ==============================================================================

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Provider Configuration: Uses region passed from var.aws_region (default: ap-southeast-1)
provider "aws" {
  region = var.aws_region
}

# 1. DynamoDB Tables Module: Creates all 11 microservice tables using "natish_" naming
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

# 2. S3 Frontend Hosting Module: Creates "natish-frontend" S3 bucket for static hosting
module "s3_frontend" {
  source       = "./modules/s3_frontend"
  bucket_name  = var.frontend_bucket_name
  project_name = var.project_name
  environment  = var.environment
}

# 3. CloudFront Distribution CDN Module: Serves S3 frontend globally over HTTPS
module "cloudfront" {
  source              = "./modules/cloudfront"
  bucket_id           = module.s3_frontend.bucket_id
  s3_website_endpoint = module.s3_frontend.website_endpoint
  project_name        = var.project_name
  environment         = var.environment
}

# 4. Cognito User Pool Module: Provides user authentication pool and app client
module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

# 5. SNS & SQS Event Messaging Module: Provisions payment SNS topic and 5 SQS event queues
module "messaging" {
  source       = "./modules/messaging"
  project_name = var.project_name
  environment  = var.environment
}

# 6. CloudWatch Dashboard Module: Provisions unified observability dashboard for all 12 microservices
module "cloudwatch" {
  source       = "./modules/cloudwatch"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# 7. IAM Deployment User Module: Provisions deployment IAM user and programmatic access keys
module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  environment  = var.environment
}

