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

# DynamoDB for storing user data
resource "aws_dynamodb_table" "user_data" {
  name         = "user_data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff User Data"
    Environment = "prod"
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