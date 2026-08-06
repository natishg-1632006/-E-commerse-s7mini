output "distribution_id" {
  value = aws_cloudfront_distribution.frontend_cdn.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend_cdn.domain_name
}
