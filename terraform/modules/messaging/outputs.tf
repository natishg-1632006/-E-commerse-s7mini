output "payment_events_topic_arn" {
  value = aws_sns_topic.payment_events.arn
}

output "notification_queue_url" {
  value = aws_sqs_queue.notification_queue.id
}

output "notification_queue_arn" {
  value = aws_sqs_queue.notification_queue.arn
}
