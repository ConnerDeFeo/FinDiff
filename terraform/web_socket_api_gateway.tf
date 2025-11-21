locals{
  web_socket_lambda_function_locations = {
    "onConnect" = "$connect",
    "onDisconnect" = "$disconnect",
    "onMessage" = "onmessage"
  }
}

# Web socket api
resource "aws_apigatewayv2_api" "web_socket_api" {
  name                       = "findiff-websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# Web socket api stage
resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.web_socket_api.id
  name        = "prod"
  auto_deploy = true
}

# connect route
resource "aws_apigatewayv2_integration" "lambda_integrations" {
  for_each        = local.web_socket_lambda_function_locations
  api_id           = aws_apigatewayv2_api.web_socket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.lambdas[each.key].invoke_arn
}

resource "aws_apigatewayv2_route" "lambda_routes" {
  for_each = local.web_socket_lambda_function_locations
  api_id    = aws_apigatewayv2_api.web_socket_api.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integrations[each.key].id}"
}

# Grant API Gateway permission to invoke Lambda functions
resource "aws_lambda_permission" "apigw_websocket_connect" {
  for_each = local.web_socket_lambda_function_locations
  statement_id  = "AllowExecutionFromAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.web_socket_api.execution_arn}/*/*"
}

output "web_socket_api_endpoint" {
  value = aws_apigatewayv2_api.web_socket_api.api_endpoint
}