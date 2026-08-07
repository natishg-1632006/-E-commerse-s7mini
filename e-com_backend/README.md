# ⚡ E-Commerce Platform - Microservices Backend Engine

> Production-grade, event-driven serverless backend architecture built with **Node.js 20**, **Express.js**, **AWS Lambda**, **Amazon DynamoDB**, **Amazon Cognito**, **Amazon SNS/SQS**, **AWS X-Ray**, and **Terraform IaC**.

---

## 🛠️ Technology Stack & Key Dependencies

* **Runtime & Framework**: Node.js 20.x, Express.js (`serverless-http` AWS Lambda adapter).
* **Database**: Amazon DynamoDB (Single & Composite Partition/Sort Keys, pay-per-request billing).
* **Authentication**: AWS Cognito User Pool (`natish-user-pool`) & JWT Verification (`aws-jwt-verify`).
* **Event Messaging**: Amazon SNS Topic (`natish-payment-events`) & 5 SQS Queues (`natish-inventory-payment-events`, `natish-notification-events`, etc.).
* **Security & Quality**: CORS origin validation, Snyk SAST vulnerability scanning, SonarCloud Quality Gate compliance.
* **Observability**: AWS X-Ray segment tracing (`AWSXRay.captureAWSv3Client`) and CloudWatch Dashboard (`natish-microservices-dashboard`).

---

## 📦 12 Microservices Overview & Schema Architecture

```text
e-com_backend/
├── analytics-service/            # Sales analytics & metric reporting (natish_user/orders metrics)
├── cart-service/                 # Shopping cart state & subtotal engine (natish_cart)
├── category-service/             # Taxonomy & category tree management (natish_categories)
├── cognito-trigger-service/      # AWS Cognito Pre-Sign-Up & Post-Confirmation triggers
├── coupon-service/               # Discount code validation & apply engine (natish_coupons)
├── inventory-service/            # Stock reservation & movements tracking (natish_inventory_v2)
├── notification-service/         # Asynchronous customer email dispatch (natish-notification-events SQS)
├── order-service/                # Order placement, status tracking & lifecycle (natish_orders)
├── payment-service/              # Transaction processing & SNS event dispatching (natish_payment)
├── product-service/              # Product catalog CRUD, search & filtering (natish_products)
├── user-service/                 # User profile & account preferences (natish_user)
└── wishlist-review-service/      # Wishlists, ratings & reviews (natish_wishlists / natish_reviews)
```

### Microservices Detailed Table

| Service Name | Primary Responsibility | Target DynamoDB Table | Partition Key (Hash) | Sort Key (Range) | API Route Base |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`user-service`** | Profile management & user data | `natish_user` | `userId` (S) | — | `/api/v1/users` |
| **`product-service`** | Catalog CRUD, search & category filter | `natish_products` | `productId` (S) | — | `/api/v1/products` |
| **`category-service`** | Category hierarchy management | `natish_categories` | `categoryId` (S) | — | `/api/v1/categories` |
| **`cart-service`** | User shopping cart state & items | `natish_cart` | `userId` (S) | — | `/api/v1/cart` |
| **`order-service`** | Order placement & status lifecycle | `natish_orders` | `orderid` (S) | — | `/api/v1/orders` |
| **`payment-service`** | Transaction execution & SNS publish | `natish_payment` | `paymentid` (S) | — | `/api/v1/payments` |
| **`inventory-service`**| Stock reservations & SQS event consumer | `natish_inventory_v2` | `productId` (S) | — | `/api/v1/inventory` |
| **`coupon-service`** | Promo code validation & discounts | `natish_coupons` | `couponCode` (S) | — | `/api/v1/coupons` |
| **`analytics-service`** | Metrics calculation & reporting | — | — | — | `/api/v1/analytics` |
| **`cognito-trigger-service`**| Cognito user onboarding hooks | — | — | — | AWS Cognito Hook |
| **`notification-service`**| Email dispatch SQS consumer | — | — | — | SQS Queue Consumer |
| **`wishlist-review-service`**| Wishlists, product ratings & reviews | `natish_wishlists`<br>`natish_reviews`<br>`natish_brands` | `userId` (S)<br>`reviewId` (S)<br>`brandId` (S) | `productId` (S)<br>—<br>— | `/api/v1/wishlists`<br>`/api/v1/reviews`<br>`/api/v1/brands` |

---

## 🔄 End-to-End Microservice Data Flow

```text
1. Customer Browses Products
   [Frontend] ──GET /api/v1/products──> [product-service] ──Reads──> [DynamoDB: natish_products]

2. Customer Adds Item to Cart
   [Frontend] ──POST /api/v1/cart/add──> [cart-service] ──Persists──> [DynamoDB: natish_cart]

3. Customer Places Order & Checkout
   [Frontend] ──POST /api/v1/orders──> [order-service] ──Validates Stock──> [inventory-service]
   [order-service] ──Creates Order (PENDING)──> [DynamoDB: natish_orders]

4. Payment Processing & Event Fanout
   [Frontend] ──POST /api/v1/payments──> [payment-service] ──Saves Payment──> [DynamoDB: natish_payment]
   [payment-service] ──Publishes Event──> [SNS: natish-payment-events]

5. Asynchronous Event Consumption (SQS Fanout)
   ├── [SNS: natish-payment-events] ──> [SQS: natish-order-payment-events] ──> [order-service] (Updates order to PAID)
   ├── [SNS: natish-payment-events] ──> [SQS: natish-inventory-payment-events] ──> [inventory-service] (Deducts reserved stock)
   └── [SNS: natish-payment-events] ──> [SQS: natish-notification-events] ──> [notification-service] (Sends email receipt)
```

---

## 🔒 Security & Code Quality

* **Cognito Authentication**: User tokens signed by `natish-user-pool` are decoded and verified using `aws-jwt-verify` in `authMiddleware.js`.
* **CORS Security**: Dynamic origin callback function (`ALLOWED_ORIGINS`) enforcing secure requests from localhost and CloudFront.
* **Modern Standard Imports**: Standardized usage of `node:crypto` (`crypto.randomInt`), `node:http`, and `node:https`.
* **SonarCloud Compliance**: Source exclusions (`sonar-project.properties`) configured for zero false positives and green **PASSED** Quality Gate rating.

---

## 📊 Observability & CloudWatch Dashboard

* **Distributed Tracing**: Standardized AWS X-Ray open/close segment tracing in Express `app.js` and AWS SDK v3 client instrumentation (`AWSXRay.captureAWSv3Client`).
* **CloudWatch Dashboard**: Unified observability dashboard **`natish-microservices-dashboard`** monitoring metrics for all 12 Lambda functions:
  * `Lambda Invocations (5-Min Sum)`
  * `Lambda Errors (5-Min Sum)`
  * `Average Latency (5-Min Avg Milliseconds)`
  * `Lambda Throttles (5-Min Sum)`

---

## 💻 Local Testing & Deployment

### Running Tests Locally
```bash
# Navigate to a microservice
cd product-service

# Run unit tests with 50%+ coverage threshold
npm run test:coverage
```

### Deploying Microservices via Serverless Framework
```bash
# Deploy an individual microservice to AWS Lambda
npx serverless deploy --stage prod
```
