output "user_table_name" {
  value = aws_dynamodb_table.users.name
}

output "product_table_name" {
  value = aws_dynamodb_table.products.name
}

output "order_table_name" {
  value = aws_dynamodb_table.orders.name
}
