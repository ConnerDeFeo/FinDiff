# Define local variables for Lambda functions and their HTTP methods
locals {
  lambdas = {
    # GET Lambdas
    "search_tickers" = {lambda = aws_lambda_function.lambdas["search_tickers"], method = "GET"}
    "get_available_10k_filings" = {lambda = aws_lambda_function.lambdas["get_available_10k_filings"], method = "GET"}

    # POST Lambdas

    # DELETE Lambdas
  }
}

# Create API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "findiff_api"
  description = "API Gateway for FinDiff Application"
}

# Create API Gateway Resources for each Lambda function
resource "aws_api_gateway_resource" "main" {
  for_each = local.lambdas

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.key
}

# Create API Gateway Methods for each Lambda function
resource "aws_api_gateway_method" "api_methods" {
  for_each = local.lambdas

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.main[each.key].id
  http_method   = each.value.method
  authorization = "NONE"
  api_key_required = true
}

# Integrate API Gateway Methods with Lambda functions
resource "aws_api_gateway_integration" "main" {
  for_each = local.lambdas

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.main[each.key].id
  http_method = each.value.method
  integration_http_method = "POST"
  type        = "AWS_PROXY"
  uri         = each.value.lambda.invoke_arn

  depends_on = [aws_api_gateway_method.api_methods]
}

# Options for CORS preflight requests
resource "aws_api_gateway_method" "options" {
  for_each = local.lambdas

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.main[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integrate API Gateway Methods with Lambda functions
resource "aws_api_gateway_integration" "options" {
  for_each = local.lambdas

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.main[each.key].id
  http_method = "OPTIONS"
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }

  depends_on = [aws_api_gateway_method.options]
}

# Method Responses for CORS
resource "aws_api_gateway_method_response" "options" {
    for_each = local.lambdas
    
    rest_api_id = aws_api_gateway_rest_api.main.id
    resource_id = aws_api_gateway_resource.main[each.key].id
    http_method = "OPTIONS"
    status_code = "200"
    
    response_parameters = {
        "method.response.header.Access-Control-Allow-Headers" = true
        "method.response.header.Access-Control-Allow-Methods" = true
        "method.response.header.Access-Control-Allow-Origin"  = true
    }

    depends_on = [aws_api_gateway_integration.options]
}

# Integration Responses for CORS
resource "aws_api_gateway_integration_response" "options" {
    for_each = local.lambdas
    
    rest_api_id = aws_api_gateway_rest_api.main.id
    resource_id = aws_api_gateway_resource.main[each.key].id
    http_method = "OPTIONS"
    status_code = "200"
    
    response_parameters = {
      "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
      "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    }

    depends_on = [aws_api_gateway_integration.options,aws_api_gateway_method_response.options]
}

# Grant API Gateway permission to invoke Lambda functions
resource "aws_lambda_permission" "api_gateway_invoke" {
  for_each = local.lambdas

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/${each.value.method}/${aws_api_gateway_resource.main[each.key].path_part}"
}

# Create API Gateway Deployments
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_method.api_methods,
    aws_api_gateway_integration.main,
    aws_api_gateway_method_response.options,
    aws_api_gateway_integration_response.options
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode(local.lambdas))
  }

  # Add this lifecycle block
  lifecycle {
    create_before_destroy = true
  }
}

# Create API Gateway Stages
resource "aws_api_gateway_stage" "api_stage" {
  stage_name    = "prod"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.api_deployment.id
}

# Specific limits for comparison endpoint
resource "aws_api_gateway_method_settings" "compare_settings" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "compare_10k_filings/POST"

  settings {
    throttling_burst_limit = 2
    throttling_rate_limit  = 1
    metrics_enabled        = true
  }
}

# Create an API Key for accessing the API
resource "aws_api_gateway_api_key" "main" {
  name = "findiff_api_key"
  enabled = true
}

# Create a Usage Plan for the API Key
resource "aws_api_gateway_usage_plan" "main" {
  name = "findiff_usage_plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.api_stage.stage_name
  }

  throttle_settings {
    burst_limit = 10
    rate_limit  = 5
  }
}

# Associate the API Key with the Usage Plan
resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}
