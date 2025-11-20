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
resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.web_socket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.lambdas["onConnect"].invoke_arn
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.web_socket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

# disconnect route
resource "aws_apigatewayv2_integration" "disconnect" {
  api_id           = aws_apigatewayv2_api.web_socket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.lambdas["onDisconnect"].invoke_arn
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.web_socket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

# onmessage route
resource "aws_apigatewayv2_integration" "onmessage" {
  api_id           = aws_apigatewayv2_api.web_socket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.lambdas["onMessage"].invoke_arn
}

resource "aws_apigatewayv2_route" "onmessage" {
  api_id    = aws_apigatewayv2_api.web_socket_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.onmessage.id}"
}

# Grant API Gateway permission to invoke Lambda functions
resource "aws_lambda_permission" "apigw_websocket_connect" {
  statement_id  = "AllowExecutionFromAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas["onConnect"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.web_socket_api.execution_arn}/*/*"
}
# Grant API Gateway permission to invoke Lambda functions
resource "aws_lambda_permission" "apigw_websocket_disconnect" {
  statement_id  = "AllowExecutionFromAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas["onDisconnect"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.web_socket_api.execution_arn}/*/*"
}
# Grant API Gateway permission to invoke Lambda functions
resource "aws_lambda_permission" "apigw_websocket_onmessage" {
  statement_id  = "AllowExecutionFromAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas["onMessage"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.web_socket_api.execution_arn}/*/*"
}