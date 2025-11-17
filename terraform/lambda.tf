# Define local map for Lambda function locations
locals {
  lambda_function_locations = {
    "compare_10k_filings" = {
      source_dir  = "../server/lambdas/comparison_analysis/compare_10k_filings"
      output_path = "../server/lambdas/comparison_analysis/zips/compare_10k_filings.zip"
    },
    "compare_10k_filings_worker" = {
      source_dir  = "../server/lambdas/comparison_analysis/compare_10k_filings_worker"
      output_path = "../server/lambdas/comparison_analysis/zips/compare_10k_filings_worker.zip"
    },
    "search_tickers" = {
      source_dir  = "../server/lambdas/search/search_tickers"
      output_path = "../server/lambdas/search/zips/search_tickers.zip"
    },
    "get_available_10k_filings" = {
      source_dir  = "../server/lambdas/search/get_available_10k_filings"
      output_path = "../server/lambdas/search/zips/get_available_10k_filings.zip"
    },
    "get_comparison_status" = {
      source_dir  = "../server/lambdas/comparison_analysis/get_comparison_status"
      output_path = "../server/lambdas/comparison_analysis/zips/get_comparison_status.zip"
    },
    "analyze_10k_section_worker" = {
      source_dir  = "../server/lambdas/single_analysis/analyze_10k_section_worker"
      output_path = "../server/lambdas/single_analysis/zips/analyze_10k_section_worker.zip"
    },
    "analyze_10k_section" = {
      source_dir  = "../server/lambdas/single_analysis/analyze_10k_section"
      output_path = "../server/lambdas/single_analysis/zips/analyze_10k_section.zip"
    },
    "get_10k_analysis_status" = {
      source_dir  = "../server/lambdas/single_analysis/get_10k_analysis_status"
      output_path = "../server/lambdas/single_analysis/zips/get_10k_analysis_status.zip"
    },
    "cache_available_10k_filings" = {
      source_dir  = "../server/lambdas/search/cache_available_10k_filings"
      output_path = "../server/lambdas/search/zips/cache_available_10k_filings.zip"
    }
  }
}

# Data layers
data "archive_file" "user_auth_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../server/layers/user_auth/"
  output_path = "${path.module}/../server/layers/user_auth/user_auth.zip"
}

data "archive_file" "dynamo_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../server/layers/dynamo/"
  output_path = "${path.module}/../server/layers/dynamo/dynamodb.zip"
}

data "archive_file" "utils_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../server/layers/utils/"
  output_path = "${path.module}/../server/layers/utils/utils.zip"
}

data "archive_file" "filings_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../server/layers/filings/"
  output_path = "${path.module}/../server/layers/filings/filings.zip"
}

resource "aws_lambda_layer_version" "user_auth" {
  filename         = data.archive_file.user_auth_layer.output_path
  layer_name       = "user_auth"
  compatible_runtimes = ["python3.12"]
  source_code_hash = data.archive_file.user_auth_layer.output_base64sha256
}

resource "aws_lambda_layer_version" "dynamo" {
  filename         = data.archive_file.dynamo_layer.output_path
  layer_name       = "dynamo"
  compatible_runtimes = ["python3.12"]
  source_code_hash = data.archive_file.dynamo_layer.output_base64sha256
}

resource "aws_lambda_layer_version" "utils" {
  filename         = data.archive_file.utils_layer.output_path
  layer_name       = "utils"
  compatible_runtimes = ["python3.12"]
  source_code_hash = data.archive_file.utils_layer.output_base64sha256
}

resource "aws_lambda_layer_version" "filings" {
  filename         = data.archive_file.filings_layer.output_path
  layer_name       = "filings"
  compatible_runtimes = ["python3.12"]
  source_code_hash = data.archive_file.filings_layer.output_base64sha256
}


# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "findiff_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Basic execution permissions
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Allow Lambda to invoke Bedrock models
resource "aws_iam_role_policy" "bedrock_policy" {
  name = "bedrock-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = "*"
    }]
  })
}

# Grant Lambda permissions to access DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda_dynamodb_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [aws_dynamodb_table.comparison_jobs.arn, aws_dynamodb_table.single_section_analysis_jobs.arn]
      }
    ]
  })
}

# Allow Lambda to invoke other Lambda functions
resource "aws_iam_role_policy" "lambda_invoke_worker" {
  name = "lambda_invoke_worker_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:us-east-2:857360184083:function:*"
      }
    ]
  })
}

# Allow lambda to access S3 bucket
resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "lambda_s3_access_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.company_filings.arn}",
          "${aws_s3_bucket.company_filings.arn}/*"
        ]
      }
    ]
  })
}

# Archive files using for_each
data "archive_file" "lambda_archives" {
  for_each = local.lambda_function_locations
  
  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = each.value.output_path
}

# Create Lambda functions using for_each
resource "aws_lambda_function" "lambdas" {
  for_each = local.lambda_function_locations

  function_name    = each.key
  role             = aws_iam_role.lambda_role.arn
  handler          = "${each.key}.${each.key}"
  runtime          = "python3.12"
  filename         = data.archive_file.lambda_archives[each.key].output_path
  source_code_hash = data.archive_file.lambda_archives[each.key].output_base64sha256
  timeout          = 180
  memory_size      = 512

  layers           = [
    aws_lambda_layer_version.user_auth.arn, 
    aws_lambda_layer_version.dynamo.arn, 
    aws_lambda_layer_version.utils.arn, 
    aws_lambda_layer_version.filings.arn
  ]
}