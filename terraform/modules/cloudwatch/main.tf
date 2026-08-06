# ==============================================================================
# CloudWatch Observability Dashboard Module for Natish Platform
# ==============================================================================
# Creates the "natish-microservices-dashboard" visualizing:
# 1. Lambda Invocations across all 12 services
# 2. Lambda Execution Errors
# 3. Lambda Latency / Duration (ms)
# 4. Lambda Throttles
# ==============================================================================

resource "aws_cloudwatch_dashboard" "microservices_dashboard" {
  dashboard_name = "${var.project_name}-microservices-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: Lambda Invocations
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "user-service-prod-api"],
            [".", ".", ".", "product-service-prod-api"],
            [".", ".", ".", "category-service-prod-api"],
            [".", ".", ".", "cart-service-prod-api"],
            [".", ".", ".", "order-service-prod-api"],
            [".", ".", ".", "payment-service-prod-api"],
            [".", ".", ".", "inventory-service-prod-api"],
            [".", ".", ".", "coupon-service-prod-api"],
            [".", ".", ".", "analytics-service-prod-api"],
            [".", ".", ".", "notification-service-prod-api"],
            [".", ".", ".", "cognito-trigger-service-prod-api"],
            [".", ".", ".", "wishlist-review-service-prod-api"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Microservices Lambda Invocations"
        }
      },
      # Widget 2: Lambda Errors
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "user-service-prod-api"],
            [".", ".", ".", "product-service-prod-api"],
            [".", ".", ".", "category-service-prod-api"],
            [".", ".", ".", "cart-service-prod-api"],
            [".", ".", ".", "order-service-prod-api"],
            [".", ".", ".", "payment-service-prod-api"],
            [".", ".", ".", "inventory-service-prod-api"],
            [".", ".", ".", "coupon-service-prod-api"],
            [".", ".", ".", "analytics-service-prod-api"],
            [".", ".", ".", "notification-service-prod-api"],
            [".", ".", ".", "cognito-trigger-service-prod-api"],
            [".", ".", ".", "wishlist-review-service-prod-api"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Microservices Lambda Errors"
        }
      },
      # Widget 3: Lambda Latency / Duration
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "user-service-prod-api"],
            [".", ".", ".", "product-service-prod-api"],
            [".", ".", ".", "category-service-prod-api"],
            [".", ".", ".", "cart-service-prod-api"],
            [".", ".", ".", "order-service-prod-api"],
            [".", ".", ".", "payment-service-prod-api"],
            [".", ".", ".", "inventory-service-prod-api"],
            [".", ".", ".", "coupon-service-prod-api"],
            [".", ".", ".", "analytics-service-prod-api"],
            [".", ".", ".", "notification-service-prod-api"],
            [".", ".", ".", "cognito-trigger-service-prod-api"],
            [".", ".", ".", "wishlist-review-service-prod-api"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Microservices Duration / Latency (ms)"
        }
      },
      # Widget 4: Lambda Throttles
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Throttles", "FunctionName", "user-service-prod-api"],
            [".", ".", ".", "product-service-prod-api"],
            [".", ".", ".", "category-service-prod-api"],
            [".", ".", ".", "cart-service-prod-api"],
            [".", ".", ".", "order-service-prod-api"],
            [".", ".", ".", "payment-service-prod-api"],
            [".", ".", ".", "inventory-service-prod-api"],
            [".", ".", ".", "coupon-service-prod-api"],
            [".", ".", ".", "analytics-service-prod-api"],
            [".", ".", ".", "notification-service-prod-api"],
            [".", ".", ".", "cognito-trigger-service-prod-api"],
            [".", ".", ".", "wishlist-review-service-prod-api"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Microservices Throttles"
        }
      }
    ]
  })
}
