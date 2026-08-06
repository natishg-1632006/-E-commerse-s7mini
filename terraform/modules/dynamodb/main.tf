# DynamoDB Table for User Service
resource "aws_dynamodb_table" "users" {
  name         = "natish_user"
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
  name         = "natish_products"
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
  name         = "natish_categories"
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
  name         = "natish_cart"
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
  name         = "natish_orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderid"

  attribute {
    name = "orderid"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "order-service"
  }
}

# DynamoDB Table for Payment Service
resource "aws_dynamodb_table" "payments" {
  name         = "natish_payment"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paymentid"

  attribute {
    name = "paymentid"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "payment-service"
  }
}

# DynamoDB Table for Inventory Service
resource "aws_dynamodb_table" "inventory" {
  name         = "natish_inventory_v2"
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
  name         = "natish_coupons"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "couponCode"

  attribute {
    name = "couponCode"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "coupon-service"
  }
}

# DynamoDB Table for Wishlists (Composite Key)
resource "aws_dynamodb_table" "wishlists" {
  name         = "natish_wishlists"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "productId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "productId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Service     = "wishlist-review-service"
  }
}

# DynamoDB Table for Reviews
resource "aws_dynamodb_table" "reviews" {
  name         = "natish_reviews"
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
  name         = "natish_brands"
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
