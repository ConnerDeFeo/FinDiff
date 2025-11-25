import boto3
from filings import *
import asyncio
import json

# Configuration constants
MAX_SECTION_TOKENS = 100000  # Maximum tokens per section before splitting
OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

async def analyze_10k_section_async(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")

    try:
        # Extract parameters from event
        stock = body['stock']
        section = body['section']

        # Extract filing details for first stock
        cik1 = stock['cik']
        accession1 = stock['accessionNumber']
        accession1 = accession1.replace('-', '')  # Remove hyphens for URL
        primaryDoc1 = stock['primaryDocument']

        # Fetch and analyze sections from both filings in parallel
        text = await get_10k_section_async(cik1, accession1, primaryDoc1, section)
        

        # Validate that sections were extracted successfully
        if not text:
            apigateway.post_to_connection(
                Data=json.dumps({
                    "type": "error",
                    "message": "Could not extract the requested section from the filing."
                }),
                ConnectionId=connection_id
            )
            return

        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-20b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            You are a value investor analyzing a 10-K section.
                            Your goal is to return a marked-down formatted summary of key insights from the filing.

                            RULES:
                            - Separate insights by section, with a heading (h2) for each section
                            - Give bullet points for each insight
                            - Keep bullet points as concise as possible.

                            Filing {section} Text:
                            {text}
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
            Data=json.dumps({
                "type": "error",
                "message": f"An error occurred: {str(e)}"
            }),
            ConnectionId=connection_id
        )

def analyze_10k_section(event, context):
    return asyncio.run(analyze_10k_section_async(event, context))
