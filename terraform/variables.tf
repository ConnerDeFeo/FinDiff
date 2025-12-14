variable "google_client_id" {
  description = "Google OAuth Client ID for Cognito Identity Provider"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for Cognito Identity Provider"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe Secret Key for payment processing"
  type        = string
  sensitive   = true
}

variable "findiff_premium_price_key" {
  description = "Stripe Price Key for FinDiff Premium subscription"
  type        = string
  sensitive   = true
}

variable "stripe_test_secret_key" {
  description = "Stripe Test Secret Key for payment processing in test environments"
  type        = string
  sensitive   = true
}

variable "findiff_test_premium_price_key" {
  description = "Stripe Test Price Key for FinDiff Premium subscription in test environments"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret for verifying webhook signatures"
  type        = string
  sensitive   = true
}