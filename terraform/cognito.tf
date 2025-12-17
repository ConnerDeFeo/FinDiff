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
        pre_token_generation            = aws_lambda_function.lambdas["pre_token_generation"].arn
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

    allowed_oauth_flows_user_pool_client = true

    explicit_auth_flows = [
        "ALLOW_CUSTOM_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH"
    ]

    supported_identity_providers = [
        "COGNITO",
        "Google"
    ]

    callback_urls = [
        "http://localhost:5173",
        "https://findiff.com"
    ]

    logout_urls = [
        "http://localhost:5173",
        "https://findiff.com"
    ]

    allowed_oauth_flows = [
        "code"
    ]

    allowed_oauth_scopes = [
        "email",
        "openid",
        "profile",
        "aws.cognito.signin.user.admin"
    ]
}

# Add google as an identity provider
resource "aws_cognito_identity_provider" "google" {
    user_pool_id = aws_cognito_user_pool.main.id
    provider_name = "Google"
    provider_type = "Google"

    attribute_mapping = {
        email = "email"
        username = "sub"
        email_verified = "email_verified"
    }

    provider_details = {
        client_id     = var.google_client_id
        client_secret = var.google_client_secret
        authorize_scopes = "email profile openid"
    }
}

# Domain for Cognito Hosted UI
resource "aws_cognito_user_pool_domain" "main" {
    domain       = "findiff-auth-domain"
    user_pool_id = aws_cognito_user_pool.main.id
}

# Output the domain URL
output "cognito_domain_url" {
    value = aws_cognito_user_pool_domain.main.domain
    description = "The domain URL for the Cognito Hosted UI"
}