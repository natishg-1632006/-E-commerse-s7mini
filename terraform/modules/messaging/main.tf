# SNS Topic for Payment Events
resource "aws_sns_topic" "payment_events" {
  name = "natish-payment-events"

  tags = {
    Environment = var.environment
    Service     = "payment-service"
  }
}

# 1. SQS Queue: natish-inventory-payment-events
resource "aws_sqs_queue" "inventory_payment_events" {
  name                       = "natish-inventory-payment-events"
  message_retention_seconds  = 864000
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Environment = var.environment
    Service     = "inventory-service"
  }
}

# 2. SQS Queue: natish-inventory-product-created
resource "aws_sqs_queue" "inventory_product_created" {
  name                       = "natish-inventory-product-created"
  message_retention_seconds  = 864000
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Environment = var.environment
    Service     = "inventory-service"
  }
}

# 3. SQS Queue: natish-notification-events
resource "aws_sqs_queue" "notification_events" {
  name                       = "natish-notification-events"
  message_retention_seconds  = 864000
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Environment = var.environment
    Service     = "notification-service"
  }
}

# 4. SQS Queue: natish-order-payment-events
resource "aws_sqs_queue" "order_payment_events" {
  name                       = "natish-order-payment-events"
  message_retention_seconds  = 864000
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Environment = var.environment
    Service     = "order-service"
  }
}

# 5. SQS Queue: natish-product-category-events
resource "aws_sqs_queue" "product_category_events" {
  name                       = "natish-product-category-events"
  message_retention_seconds  = 864000
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Environment = var.environment
    Service     = "product-service"
  }
}

# SNS Subscription for Notification Queue
resource "aws_sns_topic_subscription" "payment_to_notification" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_events.arn
}

# SQS Queue Policy for Notification Events
resource "aws_sqs_queue_policy" "notification_events_policy" {
  queue_url = aws_sqs_queue.notification_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSNSTopicToSendMessage"
        Effect    = "Allow"
        Principal = "*"
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.notification_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.payment_events.arn
          }
        }
      }
    ]
  })
}
