# ==============================================================================
# Infrastructure Outputs for Natish E-Commerce Infrastructure
# ==============================================================================

# CloudFront Distribution domain URL for accessing the application globally
output "cloudfront_domain" {
  description = "Public domain URL of the CloudFront CDN distribution"
  value       = module.cloudfront.cloudfront_domain_name
}

# S3 Frontend Bucket name
output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the static frontend assets"
  value       = module.s3_frontend.bucket_id
}

# Key DynamoDB Table names exported for application configuration
output "dynamodb_tables" {
  description = "DynamoDB table names created for backend microservices"
  value = {
    users      = module.dynamodb.user_table_name
    products   = module.dynamodb.product_table_name
    orders     = module.dynamodb.order_table_name
    categories = module.dynamodb.category_table_name
    payments   = module.dynamodb.payment_table_name
  }
}

# Cognito User Pool ID for backend JWT verification
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for user authentication"
  value       = module.cognito.user_pool_id
}

# Cognito App Client ID for frontend login requests
output "cognito_client_id" {
  description = "Cognito User Pool App Client ID"
  value       = module.cognito.user_pool_client_id
}

# SNS Topic ARN for payment and order notifications
output "payment_events_sns_topic_arn" {
  description = "SNS Topic ARN for Payment and Order event dispatching"
  value       = module.messaging.payment_events_topic_arn
}

# SQS Notification Queue URL for async message processing
output "notification_sqs_queue_url" {
  description = "SQS Queue URL for Notification Service"
  value       = module.messaging.notification_events_queue_url
}
