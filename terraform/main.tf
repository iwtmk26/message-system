data "aws_iam_role" "lambda_role" {
  name = "message-api-role-g1obgy4b"
}

resource "aws_lambda_function" "message_api_tf" {

  function_name = "message-api-tf"

  filename = "../backend/message-api/target/message-api-1.0-SNAPSHOT.jar"

  source_code_hash = filebase64sha256(
    "../backend/message-api/target/message-api-1.0-SNAPSHOT.jar"
  )

  handler = "com.message.Handler::handleRequest"

  runtime = "java21"

  role = data.aws_iam_role.lambda_role.arn

  timeout = 60

  memory_size = 512

  publish = true

  snap_start {
    apply_on = "PublishedVersions"
  }

  environment {
    variables = {
      TEAMS_EMAIL = "c9453f82.gravityoffice365.onmicrosoft.com@jp.teams.ms"
      FROM_EMAIL  = "taketo.sato@gravityoffice365.onmicrosoft.com"
    }
  }
}

resource "aws_apigatewayv2_api" "message_api" {

  name          = "message-api-tf"
  protocol_type = "HTTP"

  cors_configuration {

    allow_origins = [
      "http://localhost:5173",
      "https://d11xxeftrnkpe5.cloudfront.net"
    ]

    allow_methods = [
      "GET",
      "POST",
      "DELETE",
      "OPTIONS"
    ]

    allow_headers = [
      "content-type"
    ]

    max_age = 300
  }
}

resource "aws_apigatewayv2_integration" "message_api" {

  api_id = aws_apigatewayv2_api.message_api.id

  integration_type = "AWS_PROXY"

  integration_uri = aws_lambda_function.message_api_tf.invoke_arn

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_messages" {

  api_id = aws_apigatewayv2_api.message_api.id

  route_key = "POST /messages"

  target = "integrations/${aws_apigatewayv2_integration.message_api.id}"
}

resource "aws_apigatewayv2_stage" "default" {

  api_id = aws_apigatewayv2_api.message_api.id

  name = "$default"

  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {

  statement_id = "AllowExecutionFromAPIGateway"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.message_api_tf.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.message_api.execution_arn}/*/*"
}

resource "aws_dynamodb_table" "messages" {

  name         = "Messages"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }
}

resource "aws_ses_email_identity" "sender" {
  email = "taketo.sato@gravityoffice365.onmicrosoft.com"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "message-system-frontend"
}

resource "aws_cloudfront_distribution" "frontend" {

  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "frontend-s3"
  }

  default_cache_behavior {

    target_origin_id = "frontend-s3"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD"
    ]

    cached_methods = [
      "GET",
      "HEAD"
    ]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_dynamodb_table" "members" {

  name         = "Members"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "memberId"

  attribute {
    name = "memberId"
    type = "S"
  }
}

resource "aws_apigatewayv2_route" "get_members" {

  api_id = aws_apigatewayv2_api.message_api.id

  route_key = "GET /members"

  target = "integrations/${aws_apigatewayv2_integration.message_api.id}"
}

resource "aws_apigatewayv2_route" "get_messages" {

  api_id = aws_apigatewayv2_api.message_api.id

  route_key = "GET /messages"

  target = "integrations/${aws_apigatewayv2_integration.message_api.id}"
}

resource "aws_apigatewayv2_route" "get_message_by_id" {

  api_id = aws_apigatewayv2_api.message_api.id

  route_key = "GET /messages/{messageId}"

  target = "integrations/${aws_apigatewayv2_integration.message_api.id}"
}

resource "aws_apigatewayv2_route" "delete_messages" {

  api_id = aws_apigatewayv2_api.message_api.id

  route_key = "DELETE /messages"

  target = "integrations/${aws_apigatewayv2_integration.message_api.id}"
}