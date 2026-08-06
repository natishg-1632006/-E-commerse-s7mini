output "user_table_name" {
  value = aws_dynamodb_table.users.name
}

output "product_table_name" {
  value = aws_dynamodb_table.products.name
}

output "order_table_name" {
  value = aws_dynamodb_table.orders.name
}

output "category_table_name" {
  value = aws_dynamodb_table.categories.name
}

output "payment_table_name" {
  value = aws_dynamodb_table.payments.name
}
