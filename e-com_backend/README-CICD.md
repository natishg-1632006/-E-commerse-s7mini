# AWS Serverless Microservices CI/CD Handbook

This handbook details the production-ready CI/CD automation built for this AWS Serverless E-Commerce microservices backend. The entire pipeline is designed for security, deployment speed, sequential reliability, and automated recovery.

---

## 1. Pipeline Architecture

```text
                  Developer push to GitHub
                             │
                             ▼
                 [ci.yml / detect-changes]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
    [validate-service-1]             [validate-service-2]
    - Lint / Prettier                - Lint / Prettier
    - Jest / 90% Coverage            - Jest / 90% Coverage
    - Security Audit (npm audit)     - Security Audit (npm audit)
    - Serverless Package             - Serverless Package
            │                                 │
            └────────────────┬────────────────┘
                             │ (All pass, merge to main)
                             ▼
                         [cd.yml]
                             │
                  [deploy-user-service] (HTTP 200 Health check verify)
                             │ (Skip if no changes)
                             ▼
                [deploy-category-service] (HTTP 200 Health check verify)
                             │
                             ▼
                 [deploy-product-service] (HTTP 200 Health check verify)
                             │
                             ▼
                            ... (Strict deployment order)
                             │
                             ▼
               [deploy-wishlist-review-service] (Last service)
                             │
                             ▼
                [ notify-summary / summary page ]
```

---

## 2. CI Workflow (`ci.yml`)

The CI workflow validates code changes on pull requests or direct pushes:
1. **Change Detection**: Dynamically filters changes to run checks only on directories with modified code.
2. **Setup and Dependency Caching**: Caches NPM dependencies per microservice to minimize network overhead and deployment time.
3. **NPM `ci`**: Installs lockfile dependencies.
4. **Code Quality**: Runs Prettier format checks and ESLint using shared root configuration files.
5. **Unit Tests and Coverage**: Executes Jest unit tests. The pipeline fails automatically if statement, branch, function, or line coverage is **below 90%** using Jest's dynamic `--coverageThreshold` injection.
6. **Security Audit**: Runs `npm audit` on high and critical level vulnerabilities.
7. **Serverless Packaging**: Runs `serverless package` with stage `dev` to verify that CloudFormation compilation succeeds.

---

## 3. CD Workflow (`cd.yml`)

The CD workflow deploys services in a strict, sequential dependency order upon merge to `main`:
1. **Deployment Sequence**:
   `user-service` -> `category-service` -> `product-service` -> `inventory-service` -> `coupon-service` -> `cart-service` -> `order-service` -> `payment-service` -> `analytics-service` -> `cognito-trigger-service` -> `notification-service` -> `wishlist-review-service`.
2. **Sequential Dependents**: A job will run only if the previous job in the chain completed successfully (or was safely skipped because it had no changes). If a preceding job fails, GHA cancels the remaining queue immediately.
3. **Reusable Deployments**: Deployment jobs delegate to `.github/workflows/reusable-deploy.yml` to maintain a DRY (Don't Repeat Yourself) pipeline.

---

## 4. Deployment Verification

Every HTTP-exposed microservice defines a `GET /health` endpoint returning `HTTP 200`. The deployment job verifies it post-deployment:
1. **API Gateway URL Extraction**: The reusable workflow executes `.github/scripts/parse_endpoint.js` on the Serverless stdout logs to extract the live API Gateway endpoint.
2. **Polling Health Checks**: Polls `GET /health` up to 5 times (waiting 15 seconds between runs).

---

## 5. Required GitHub Secrets

Configure the following secrets in your GitHub repository setting:

| Secret Name | Purpose | Example / Format |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | AWS Credentials for IAM User | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS Target Region | `ap-southeast-1` |
| `SERVERLESS_ACCESS_KEY` | Dashboard authentication (if used) | `sls-xxxx-xxxx-xxxx` |

---

## 6. Troubleshooting

* **Serverless template compilation failure**: Make sure you have set the dummy values or correct environment variables in the workflow. We have already declared dummy defaults in GHA to pass the compilation checks.
