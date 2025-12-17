# DynamoDB table for storing websocket connections
resource "aws_dynamodb_table" "websocket_connections" {
  name         = "websocket_connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connection_id"

  attribute {
    name = "connection_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "FinDiff WebSocket Connections"
    Environment = "prod"
  }
}

# DynamoDB for storing if a docuemnt has been processed
resource "aws_dynamodb_table" "processed_documents" {
  name         = "processed_documents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "document_id"

  attribute {
    name = "document_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff Processed Documents"
    Environment = "prod"
  }
}

# DynamoDB for storing conversation history
resource "aws_dynamodb_table" "conversation_history" {
  name         = "conversation_history"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "conversation_id"
  range_key    = "timestamp"

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  tags = {
    Name        = "FinDiff Conversation History"
    Environment = "prod"
  }
}

# DynamoDB for storing user details
resource "aws_dynamodb_table" "user_details" {
  name         = "user_details"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff User Details"
    Environment = "prod"
  }
}

# DynamoDB for mapping stripe customers to user ids
resource "aws_dynamodb_table" "stripe_customers" {
  name         = "stripe_customers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "stripe_customer_id"

  attribute {
    name = "stripe_customer_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff Stripe Customers"
    Environment = "prod"
  }
}

# DynamoDB for trackigin how many actions free users have left
resource "aws_dynamodb_table" "free_user_actions" {
  name         = "free_user_actions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key  = "user_id"
  range_key = "day"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "day"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Create s3 bucket to store company filings
resource "aws_s3_bucket" "company_filings" {
  bucket = "findiff-bucket-prod"

  tags = {
    Name        = "FinDiff Bucket"
    Environment = "prod"
  }
}