# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "findiff_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}
# Basic execution permissions
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Allow Lambda to invoke Bedrock models
resource "aws_iam_role_policy" "bedrock_policy" {
  name = "bedrock-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ]
      Resource = "*"
    }]
  })
}

# Grant Lambda permissions to access DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda_dynamodb_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.websocket_connections.arn, 
          aws_dynamodb_table.processed_documents.arn,
          aws_dynamodb_table.conversation_history.arn,
          aws_dynamodb_table.user_details.arn,
          aws_dynamodb_table.stripe_customers.arn
        ]
      }
    ]
  })
}

# Allow Lambda to invoke other Lambda functions
resource "aws_iam_role_policy" "lambda_invoke_worker" {
  name = "lambda_invoke_worker_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:us-east-2:857360184083:function:*"
      }
    ]
  })
}

# Allow lambda to access S3 bucket
resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "lambda_s3_access_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.company_filings.arn}",
          "${aws_s3_bucket.company_filings.arn}/*"
        ]
      }
    ]
  })
}

# Allow lambda to send messages through API Gateway WebSocket
resource "aws_iam_role_policy" "apigateway_management" {
  name = "apigateway_management_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "${aws_apigatewayv2_api.web_socket_api.execution_arn}/*"
      }
    ]
  })
}

# Allow lambda to use SES to send emails
resource "aws_iam_role_policy" "ses_send_email" {
  name = "ses_send_email_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Allow cognito lambda triggers
resource "aws_lambda_permission" "allow_cognito" {
  for_each = aws_lambda_function.lambdas

  statement_id  = "AllowExecutionFromCognito-${each.value.function_name}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}