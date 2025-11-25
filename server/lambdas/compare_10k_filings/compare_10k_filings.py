import boto3
import asyncio
from filings import *
import json

# Configuration constants
MAX_SECTION_TOKENS = 100000  # Maximum tokens per section before splitting
OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

async def compare_10k_filings_async(event, context):
    """
    Main async worker function to compare sections between two 10-K filings.
    Updates DynamoDB with progress and results.
    
    Args:
        event: Lambda event containing stock1, stock2, jobId, and section
        context: Lambda context object
    """
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")

    try:
        # Extract parameters from event
        stock1 = body['stock1']
        stock2 = body['stock2']
        section = body['section']

        # Extract filing details for first stock
        cik1 = stock1['cik']
        accession1 = stock1['accessionNumber']
        accession1 = accession1.replace('-', '')  # Remove hyphens for URL
        primaryDoc1 = stock1['primaryDocument']

        # Extract filing details for second stock
        cik2 = stock2['cik']
        accession2 = stock2['accessionNumber']
        accession2 = accession2.replace('-', '')  # Remove hyphens for URL
        primaryDoc2 = stock2['primaryDocument']

        # Validate that both filings are for the same company
        if cik1 != cik2:
            apigateway.post_to_connection(
                Data=json.dumps({
                    "type": "error",
                    "message": "Both filings must be for the same company to compare."
                }),
                ConnectionId=connection_id
            )
            return

        # Fetch and analyze sections from both filings in parallel
        old_text, new_text = await asyncio.gather(
            get_10k_section_async(cik1, accession1, primaryDoc1, section),
            get_10k_section_async(cik2, accession2, primaryDoc2, section)
        )

        # Validate that sections were extracted successfully
        if not old_text or not new_text:
            apigateway.post_to_connection(
                Data=json.dumps({
                    "type": "error",
                    "message": "Could not extract the requested section from one or both filings."
                }),
                ConnectionId=connection_id
            )
            return
        
        # Use Bedrock AI to compare the sections and generate insights
        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-20b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            You are a value investor analyzing 10-K changes for certain sections.
                            Your goal is to return a marked-down formatted summary of key insights from the changes between the two filings.

                            RULES:
                            - Separate insights by section, with a heading (h2) for each section
                            - If a section has no significant changes, state "No significant changes"
                            - Skip administrative updates (dates, formatting, minor legal updates)
                            - Give bullet points for each insight
                            - Keep bullet points as concise as possible.

                            Old Filing {section} Section: 
                            {old_text}

                            New Filing {section} Section:
                            {new_text}
                        """
                    }]
                },
            ],
            inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
        )
        
        stream = response.get('stream')
        if stream:
            for stream_event in stream:
                if 'contentBlockDelta' in stream_event:
                    delta = stream_event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        text_chunk = delta['text']
                        apigateway.post_to_connection(
                            ConnectionId=connection_id,
                            Data=json.dumps({'type': 'chunk', 'data': text_chunk})
                        )
                        
                elif 'messageStop' in stream_event:
                    # Stream finished
                    break
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'complete'})
        )
        
    except Exception as e:
        # Handle any errors and update job status
        print(f"Error fetching filings: {str(e)}")
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'error', 'message': f"Internal Server Error: {str(e)}"})
        )

def compare_10k_filings(event, context):
    """
    Lambda handler function that wraps the async worker.
    
    Args:
        event: Lambda event object
        context: Lambda context object
    """
    return asyncio.run(compare_10k_filings_async(event, context))