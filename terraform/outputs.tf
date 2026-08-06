output "cloudfront_domain" {
  description = "The domain name of the CloudFront CDN distribution"
  value       = module.cloudfront.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend"
  value       = module.s3_frontend.bucket_id
}

output "dynamodb_tables" {
  description = "Key DynamoDB table names created for the microservices"
  value = {
    users    = module.dynamodb.user_table_name
    products = module.dynamodb.product_table_name
    orders   = module.dynamodb.order_table_name
  }
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool App Client ID"
  value       = module.cognito.user_pool_client_id
}

output "payment_events_sns_topic_arn" {
  description = "SNS Topic ARN for Payment & Order Events"
  value       = module.messaging.payment_events_topic_arn
}

output "notification_sqs_queue_url" {
  description = "SQS Queue URL for Notification Service"
  value       = module.messaging.notification_queue_url
}
