# ==============================================================================
# Event Messaging Module for Natish Platform (SNS Topics & SQS Queues)
# ==============================================================================
# Provisions exact AWS Console SQS Queues and SNS Topics for async messaging:
# 1. SNS Topic  -> natish-payment-events
# 2. SQS Queue -> natish-inventory-payment-events
# 3. SQS Queue -> natish-inventory-product-created
# 4. SQS Queue -> natish-notification-events
# 5. SQS Queue -> natish-order-payment-events
# 6. SQS Queue -> natish-product-category-events
# ==============================================================================

# SNS Topic for Payment & Order Events
resource "aws_sns_topic" "payment_events" {
  name = "natish-payment-events"

  tags = {
    Environment = var.environment
    Service     = "payment-service"
  }
}

# 1. SQS Queue for Inventory Payment Events
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

# 2. SQS Queue for Inventory Product Created Events
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

# 3. SQS Queue for Customer Notification Events
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

# 4. SQS Queue for Order Payment Processing Events
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

# 5. SQS Queue for Product Category Event Synchronization
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

# SNS Topic Subscription: Connects natish-payment-events SNS topic to natish-notification-events SQS queue
resource "aws_sns_topic_subscription" "payment_to_notification" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_events.arn
}

# IAM Queue Policy: Allows SNS topic natish-payment-events to send messages to natish-notification-events queue
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
