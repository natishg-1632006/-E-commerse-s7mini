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
            ["AWS/Lambda", "Invocations", "FunctionName", "natish_user_service_lambda"],
            [".", ".", ".", "natish_product_service_lambda"],
            [".", ".", ".", "natish_category_service_lambda"],
            [".", ".", ".", "natish_cart_service_lambda"],
            [".", ".", ".", "natish_order_service_lambda"],
            [".", ".", ".", "natish_payment_service_lambda"],
            [".", ".", ".", "natish_inventory_service_lambda"],
            [".", ".", ".", "natish_coupon_service_lambda"],
            [".", ".", ".", "natish_analytics_service_lambda"],
            [".", ".", ".", "natish_notification_service_lambda"],
            [".", ".", ".", "natish_cognito_trigger_service_lambda"],
            [".", ".", ".", "natish_wishlist_review_service_lambda"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Invocations (5-Min Sum)"
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
            ["AWS/Lambda", "Errors", "FunctionName", "natish_user_service_lambda"],
            [".", ".", ".", "natish_product_service_lambda"],
            [".", ".", ".", "natish_category_service_lambda"],
            [".", ".", ".", "natish_cart_service_lambda"],
            [".", ".", ".", "natish_order_service_lambda"],
            [".", ".", ".", "natish_payment_service_lambda"],
            [".", ".", ".", "natish_inventory_service_lambda"],
            [".", ".", ".", "natish_coupon_service_lambda"],
            [".", ".", ".", "natish_analytics_service_lambda"],
            [".", ".", ".", "natish_notification_service_lambda"],
            [".", ".", ".", "natish_cognito_trigger_service_lambda"],
            [".", ".", ".", "natish_wishlist_review_service_lambda"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Errors (5-Min Sum)"
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
            ["AWS/Lambda", "Duration", "FunctionName", "natish_user_service_lambda"],
            [".", ".", ".", "natish_product_service_lambda"],
            [".", ".", ".", "natish_category_service_lambda"],
            [".", ".", ".", "natish_cart_service_lambda"],
            [".", ".", ".", "natish_order_service_lambda"],
            [".", ".", ".", "natish_payment_service_lambda"],
            [".", ".", ".", "natish_inventory_service_lambda"],
            [".", ".", ".", "natish_coupon_service_lambda"],
            [".", ".", ".", "natish_analytics_service_lambda"],
            [".", ".", ".", "natish_notification_service_lambda"],
            [".", ".", ".", "natish_cognito_trigger_service_lambda"],
            [".", ".", ".", "natish_wishlist_review_service_lambda"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Average Latency (5-Min Avg Milliseconds)"
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
            ["AWS/Lambda", "Throttles", "FunctionName", "natish_user_service_lambda"],
            [".", ".", ".", "natish_product_service_lambda"],
            [".", ".", ".", "natish_category_service_lambda"],
            [".", ".", ".", "natish_cart_service_lambda"],
            [".", ".", ".", "natish_order_service_lambda"],
            [".", ".", ".", "natish_payment_service_lambda"],
            [".", ".", ".", "natish_inventory_service_lambda"],
            [".", ".", ".", "natish_coupon_service_lambda"],
            [".", ".", ".", "natish_analytics_service_lambda"],
            [".", ".", ".", "natish_notification_service_lambda"],
            [".", ".", ".", "natish_cognito_trigger_service_lambda"],
            [".", ".", ".", "natish_wishlist_review_service_lambda"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Throttles (5-Min Sum)"
        }
      }
    ]
  })
}
