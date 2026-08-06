output "payment_events_topic_arn" {
  value = aws_sns_topic.payment_events.arn
}

output "inventory_payment_events_queue_url" {
  value = aws_sqs_queue.inventory_payment_events.id
}

output "inventory_product_created_queue_url" {
  value = aws_sqs_queue.inventory_product_created.id
}

output "notification_events_queue_url" {
  value = aws_sqs_queue.notification_events.id
}

output "order_payment_events_queue_url" {
  value = aws_sqs_queue.order_payment_events.id
}

output "product_category_events_queue_url" {
  value = aws_sqs_queue.product_category_events.id
}
