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