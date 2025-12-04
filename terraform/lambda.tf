# Define local map for Lambda function locations
locals {
  lambda_function_locations = {
    "compare_10k_filings" = {
      source_dir  = "../server/lambdas/compare_10k_filings"
      output_path = "../server/lambdas/zips/compare_10k_filings.zip"
      layers      = ["filings"]
    },
    "search_tickers" = {
      source_dir  = "../server/lambdas/search/search_tickers"
      output_path = "../server/lambdas/search/zips/search_tickers.zip"
      layers      = ["user_auth"]
    },
    "get_available_10k_filings" = {
      source_dir  = "../server/lambdas/search/get_available_10k_filings"
      output_path = "../server/lambdas/search/zips/get_available_10k_filings.zip"
      layers      = ["filings","user_auth", "utils"]
    },
    "analyze_10k_section" = {
      source_dir  = "../server/lambdas/analyze_10k_section"
      output_path = "../server/lambdas/zips/analyze_10k_section.zip"
      layers      = ["filings"]
    },
    "cache_available_10k_filings" = {
      source_dir  = "../server/lambdas/search/cache_available_10k_filings"
      output_path = "../server/lambdas/search/zips/cache_available_10k_filings.zip"
      layers      = ["filings","user_auth"]
    },
    "generate_response" = {
      source_dir  = "../server/lambdas/generate_response"
      output_path = "../server/lambdas/zips/generate_response.zip"
      layers      = ["filings", "dynamo"]
    },
    "generate_multi_context_response" = {
      source_dir  = "../server/lambdas/generate_multi_context_response"
      output_path = "../server/lambdas/zips/generate_multi_context_response.zip"
      layers      = ["filings", "dynamo"]
    },
    "onConnect" = {
      source_dir  = "../server/lambdas/websocket/onConnect"
      output_path = "../server/lambdas/websocket/zips/onConnect.zip"
      layers      = ["dynamo"]
    },
    "onDisconnect" = {
      source_dir  = "../server/lambdas/websocket/onDisconnect"
      output_path = "../server/lambdas/websocket/zips/onDisconnect.zip"
      layers      = ["dynamo"]
    },
    "check_document_processed" = {
      source_dir  = "../server/lambdas/check_document_processed"
      output_path = "../server/lambdas/zips/check_document_processed.zip"
      layers      = ["dynamo", "user_auth" ]
    },
    "upload_document" = {
      source_dir  = "../server/lambdas/upload_document"
      output_path = "../server/lambdas/zips/upload_document.zip"
      layers      = ["filings","dynamo"]
    },
    "define_auth_challenge" = {
      source_dir  = "../server/lambdas/cognito/define_auth_challenge"
      output_path = "../server/lambdas/cognito/zips/define_auth_challenge.zip"
      layers      = []
    },
    "create_auth_challenge" = {
      source_dir  = "../server/lambdas/cognito/create_auth_challenge"
      output_path = "../server/lambdas/cognito/zips/create_auth_challenge.zip"
      layers      = []
    },
    "verify_auth_challenge" = {
      source_dir  = "../server/lambdas/cognito/verify_auth_challenge"
      output_path = "../server/lambdas/cognito/zips/verify_auth_challenge.zip"
      layers      = []
    }
  }
  layers = {
    "user_auth"      = {
      source_dir  = "${path.module}/../server/layers/user_auth/"
      output_path = "${path.module}/../server/layers/user_auth/user_auth.zip"
    },
    "dynamo"         = {
      source_dir  = "${path.module}/../server/layers/dynamo/"
      output_path = "${path.module}/../server/layers/dynamo/dynamodb.zip"
    },
    "utils"          = {
      source_dir  = "${path.module}/../server/layers/utils/"
      output_path = "${path.module}/../server/layers/utils/utils.zip"
    },
    "filings"        = {
      source_dir  = "${path.module}/../server/layers/filings/"
      output_path = "${path.module}/../server/layers/filings/filings.zip"
    }
  }
}

# Data layers
data "archive_file" "lambda_layers" {
  for_each    = local.layers
  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = each.value.output_path
}

resource "aws_lambda_layer_version" "lambda_layers" {
  for_each            = local.layers
  filename            = data.archive_file.lambda_layers[each.key].output_path
  layer_name          = each.key
  compatible_runtimes = ["python3.12"]
  source_code_hash    = data.archive_file.lambda_layers[each.key].output_base64sha256
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
  timeout          = 500
  memory_size      = 512

  environment {
    variables = {
      PINECONE_API_KEY = var.pinecone_api_key
    }
  }

  layers           = [for layer_name in each.value.layers : aws_lambda_layer_version.lambda_layers[layer_name].arn]
}