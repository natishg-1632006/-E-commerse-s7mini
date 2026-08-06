# DynamoDB Table for User Service
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "user-service"
  }
}

# DynamoDB Table for Product Service
resource "aws_dynamodb_table" "products" {
  name         = "${var.project_name}-products-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "productId"

  attribute {
    name = "productId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "product-service"
  }
}

# DynamoDB Table for Category Service
resource "aws_dynamodb_table" "categories" {
  name         = "${var.project_name}-categories-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "categoryId"

  attribute {
    name = "categoryId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "category-service"
  }
}

# DynamoDB Table for Cart Service
resource "aws_dynamodb_table" "cart" {
  name         = "${var.project_name}-cart-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "cart-service"
  }
}

# DynamoDB Table for Order Service
resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-orders-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "order-service"
  }
}

# DynamoDB Table for Payment Service
resource "aws_dynamodb_table" "payments" {
  name         = "${var.project_name}-payments-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paymentId"

  attribute {
    name = "paymentId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "payment-service"
  }
}

# DynamoDB Table for Inventory Service
resource "aws_dynamodb_table" "inventory" {
  name         = "${var.project_name}-inventory-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "productId"

  attribute {
    name = "productId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "inventory-service"
  }
}

# DynamoDB Table for Coupon Service
resource "aws_dynamodb_table" "coupons" {
  name         = "${var.project_name}-coupons-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "couponId"

  attribute {
    name = "couponId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "coupon-service"
  }
}

# DynamoDB Table for Wishlists
resource "aws_dynamodb_table" "wishlists" {
  name         = "${var.project_name}-wishlists-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "wishlist-review-service"
  }
}

# DynamoDB Table for Reviews
resource "aws_dynamodb_table" "reviews" {
  name         = "${var.project_name}-reviews-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "reviewId"

  attribute {
    name = "reviewId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "wishlist-review-service"
  }
}

# DynamoDB Table for Brands
resource "aws_dynamodb_table" "brands" {
  name         = "${var.project_name}-brands-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "brandId"

  attribute {
    name = "brandId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "wishlist-review-service"
  }
}
