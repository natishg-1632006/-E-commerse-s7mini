# SNS Topic for Payment & Order Events
resource "aws_sns_topic" "payment_events" {
  name = "payment-events-${var.environment}"

  tags = {
    Environment = var.environment
    Service     = "payment-service"
  }
}

# SQS Queue for Notification Service
resource "aws_sqs_queue" "notification_queue" {
  name                       = "notification-queue-${var.environment}"
  message_retention_seconds  = 864000 # 10 days
  visibility_timeout_seconds = 30

  tags = {
    Environment = var.environment
    Service     = "notification-service"
  }
}

# Subscription: Connect SNS Topic to SQS Notification Queue
resource "aws_sns_topic_subscription" "payment_to_notification" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn
}

# SQS Policy allowing SNS Topic to send messages
resource "aws_sqs_queue_policy" "notification_queue_policy" {
  queue_url = aws_sqs_queue.notification_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSNSTopicToSendMessage"
        Effect    = "Allow"
        Principal = "*"
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.notification_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.payment_events.arn
          }
        }
      }
    ]
  })
}
