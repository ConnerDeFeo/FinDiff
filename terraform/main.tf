# Create DynamoDB table for comparison jobs
resource "aws_dynamodb_table" "comparison_jobs" {
  name         = "comparison_jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "job_id"

  attribute {
    name = "job_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff Comparison Jobs"
    Environment = "prod"
  }
}

# Create DynamoDB table for single section analysis jobs
resource "aws_dynamodb_table" "single_section_analysis_jobs" {
  name         = "single_section_analysis_jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "job_id"

  attribute {
    name = "job_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff Single Section Analysis Jobs"
    Environment = "prod"
  }
}

# Create dynamodb table for user chatbot sessions
resource "aws_dynamodb_table" "conversation_jobs" {
  name         = "conversation_jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "job_id"

  attribute {
    name = "job_id"
    type = "S"
  }

  tags = {
    Name        = "FinDiff Conversation Jobs"
    Environment = "prod"
  }
}

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

# Create s3 bucket to store company filings
resource "aws_s3_bucket" "company_filings" {
  bucket = "findiff-bucket-prod"

  tags = {
    Name        = "FinDiff Bucket"
    Environment = "prod"
  }
}