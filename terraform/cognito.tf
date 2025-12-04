resource "aws_cognito_user_pool" "main" {
    name         = "findiff-user-pool"
  
    auto_verified_attributes = ["email"]
    username_attributes      = ["email"]

    password_policy {
      minimum_length    = 8
      require_uppercase = true
      require_lowercase = true
      require_numbers   = true
      require_symbols   = true
    }
}

resource "aws_cognito_user_pool_client" "client" {
    name         = "findiff-user-pool-client"
    user_pool_id = aws_cognito_user_pool.main.id
    generate_secret = false

    explicit_auth_flows = [
        "ALLOW_USER_PASSWORD_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
        "ALLOW_USER_SRP_AUTH"
    ]
}
