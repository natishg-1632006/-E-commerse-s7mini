terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. DynamoDB Tables for all microservices
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

# 2. S3 Bucket for Static Frontend Hosting
module "s3_frontend" {
  source       = "./modules/s3_frontend"
  bucket_name  = var.frontend_bucket_name
  project_name = var.project_name
  environment  = var.environment
}

# 3. CloudFront Distribution CDN
module "cloudfront" {
  source              = "./modules/cloudfront"
  bucket_id           = module.s3_frontend.bucket_id
  s3_website_endpoint = module.s3_frontend.website_endpoint
  project_name        = var.project_name
  environment         = var.environment
}

# 4. Cognito User Pool & App Client
module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

# 5. SNS & SQS Event Messaging
module "messaging" {
  source       = "./modules/messaging"
  project_name = var.project_name
  environment  = var.environment
}
