# ==============================================================================
# DynamoDB Tables Module for Natish Microservices Platform
# ==============================================================================
# All table names and schema keys match serverless.yml specifications:
# 1. User Service          -> natish_user (HashKey: userId)
# 2. Product Service       -> natish_products (HashKey: productId)
# 3. Category Service      -> natish_categories (HashKey: categoryId)
# 4. Cart Service          -> natish_cart (HashKey: userId)
# 5. Order Service         -> natish_orders (HashKey: orderid - lowercase)
# 6. Payment Service       -> natish_payment (HashKey: paymentid - lowercase)
# 7. Inventory Service     -> natish_inventory_v2 (HashKey: productId)
# 8. Coupon Service        -> natish_coupons (HashKey: couponCode)
# 9. Wishlist Service      -> natish_wishlists (Composite: userId + productId)
# 10. Review Service       -> natish_reviews (HashKey: reviewId)
# 11. Brand Service        -> natish_brands (HashKey: brandId)
# ==============================================================================

# 1. User Service Table
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

# 2. Product Service Table
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

# 3. Category Service Table
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

# 4. Cart Service Table
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

# 5. Order Service Table (Uses lowercase orderid as partition key)
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

# 6. Payment Service Table (Uses lowercase paymentid as partition key)
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

# 7. Inventory Service Table (Uses natish_inventory_v2 as table name)
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

# 8. Coupon Service Table (Uses couponCode as partition key)
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

# 9. Wishlist Service Table (Composite Key: userId + productId)
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

# 10. Review Service Table
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

# 11. Brand Service Table
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
