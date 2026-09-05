# ==============================================================================
# Outputs for IAM Module
# ==============================================================================

output "user_name" {
  description = "Name of the created IAM deployment user"
  value       = aws_iam_user.deployment_user.name
}

output "user_arn" {
  description = "ARN of the created IAM deployment user"
  value       = aws_iam_user.deployment_user.arn
}

output "access_key_id" {
  description = "Programmatic Access Key ID for deployment user"
  value       = aws_iam_access_key.deployment_user_key.id
}

output "secret_access_key" {
  description = "Secret Access Key for deployment user"
  value       = aws_iam_access_key.deployment_user_key.secret
  sensitive   = true
}

output "console_password" {
  description = "Console Login Password for IAM deployment user"
  value       = aws_iam_user_login_profile.deployment_user_password.password
  sensitive   = true
}

