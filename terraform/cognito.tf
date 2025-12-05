# Terraform Cognito User Pool and Client Configuration, no password limitations
resource "aws_cognito_user_pool" "main" {
    name         = "findiff-user-pool"
  
    auto_verified_attributes = ["email"]
    username_attributes      = ["email"]

    lambda_config {
        define_auth_challenge           = aws_lambda_function.lambdas["define_auth_challenge"].arn
        create_auth_challenge           = aws_lambda_function.lambdas["create_auth_challenge"].arn
        verify_auth_challenge_response  = aws_lambda_function.lambdas["verify_auth_challenge"].arn
        pre_sign_up                     = aws_lambda_function.lambdas["pre_sign_up"].arn
    }

    password_policy {
        minimum_length                   = 8
        require_uppercase                = false
        require_lowercase                = false
        require_numbers                  = false
        require_symbols                  = false
    }

    depends_on = [
        aws_lambda_function.lambdas
    ]
}

resource "aws_cognito_user_pool_client" "client" {
    name         = "findiff-user-pool-client"
    user_pool_id = aws_cognito_user_pool.main.id
    generate_secret = false

    explicit_auth_flows = [
        "ALLOW_CUSTOM_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
    ]
}