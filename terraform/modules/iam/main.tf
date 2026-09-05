# ==============================================================================
# IAM Module: Deployment User & Access Key Management
# ==============================================================================

# 1. IAM Deployment User for Serverless & CI/CD Pipelines
resource "aws_iam_user" "deployment_user" {
  name = "${var.project_name}-deployment-user"

  tags = {
    Name        = "${var.project_name}-deployment-user"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 2. IAM Policy with full permissions for project resources
resource "aws_iam_policy" "deployment_policy" {
  name        = "${var.project_name}-deployment-policy"
  description = "IAM policy granting permissions to manage microservice infrastructure for ${var.project_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "dynamodb:*",
          "s3:*",
          "cloudfront:*",
          "cognito-idp:*",
          "sns:*",
          "sqs:*",
          "cloudwatch:*",
          "logs:*",
          "lambda:*",
          "apigateway:*",
          "cloudformation:*",
          "iam:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# 3. Attach policy to user
resource "aws_iam_user_policy_attachment" "attach_deployment_policy" {
  user       = aws_iam_user.deployment_user.name
  policy_arn = aws_iam_policy.deployment_policy.arn
}

# 4. Generate Programmatic Access Keys for GitHub Actions / Local CLI
resource "aws_iam_access_key" "deployment_user_key" {
  user = aws_iam_user.deployment_user.name
}

# 5. Enable Console Password Access for Web Browser Sign-In
resource "aws_iam_user_login_profile" "deployment_user_password" {
  user                    = aws_iam_user.deployment_user.name
  password_reset_required = false
}

