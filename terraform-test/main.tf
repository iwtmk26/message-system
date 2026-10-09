# テスト環境。本番（../terraform）とは別の state で管理する。
# 本番の資源（SES の検証済みID、S3、CloudFront など）は作らない。

locals {
  name = "message-api-test"
}

# 本番と同じ実行ロールを使う。
# このロールが Messages-test / Members-test に書き込めるかは未確認（docs/環境分離設計.md）。
data "aws_iam_role" "lambda_role" {
  name = "message-api-role-g1obgy4b"
}

resource "aws_dynamodb_table" "messages" {
  name         = "Messages-test"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "members" {
  name         = "Members-test"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "memberId"

  attribute {
    name = "memberId"
    type = "S"
  }
}

resource "aws_lambda_function" "api" {
  function_name = local.name

  filename         = "../backend/message-api/target/message-api-1.0-SNAPSHOT.jar"
  source_code_hash = filebase64sha256("../backend/message-api/target/message-api-1.0-SNAPSHOT.jar")

  handler = "com.message.Handler::handleRequest"
  runtime = "java21"
  role    = data.aws_iam_role.lambda_role.arn

  timeout     = 60
  memory_size = 512

  # テストでは SnapStart を使わない（費用を避ける）

  environment {
    variables = {
      MESSAGES_TABLE = aws_dynamodb_table.messages.name
      MEMBERS_TABLE  = aws_dynamodb_table.members.name
      # 99_テスト - 20_技術部
      TEAMS_EMAIL = "371a9bd5.gravityoffice365.onmicrosoft.com@jp.teams.ms"
      # SES で検証済みのアドレスであること（コンソールで検証する。この stack では作らない）
      # Teams のアイコンが出るよう、Teams 組織のアドレスにする
      FROM_EMAIL = "mako.iwata@gravityoffice365.onmicrosoft.com"
    }
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.name
  protocol_type = "HTTP"

  cors_configuration {
    # テストは自分のPCの画面からだけ使う
    allow_origins = ["http://localhost:5173"]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = toset([
    "GET /members",
    "GET /messages",
    "GET /messages/{messageId}",
    "DELETE /messages",
    "POST /messages",
  ])

  api_id    = aws_apigatewayv2_api.api.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
