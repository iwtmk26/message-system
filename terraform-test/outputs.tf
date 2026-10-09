output "api_url" {
  description = "テスト用 API の URL（frontend/.env.development.local の VITE_API_BASE_URL に書く）"
  value       = aws_apigatewayv2_api.api.api_endpoint
}
