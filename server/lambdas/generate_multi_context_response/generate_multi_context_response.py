import json
from filings import get_multiple_10k_sections_async, get_relevant_sections
import boto3
import asyncio

OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

async def generate_multi_context_response_async(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")

    try:
        # Extract parameters from event
        stocks = body["stocks"] # {cik, accession, primaryDoc}[]
        prompt = body["prompt"]

        # Parse user prompt to identify requested sections
        sections = get_relevant_sections(prompt).get("sections", [])
        summaires = [] # list of dictionaries {section: summary text} for each stock
        for stock in stocks:
            cik = stock["cik"]
            accession = stock["accession"]
            primaryDoc = stock["primaryDoc"]
            summaires.append(
                get_multiple_10k_sections_async(
                    cik, accession.replace("-", ""), primaryDoc, sections
                )
            )
        section_texts = await asyncio.gather(*summaires)

        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-20b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": f"""
                        You are an expert financial analyst. Using the following extracted sections from multiple 10-K filings,
                        provide a detailed response to the user's prompt below.

                        User Prompt:
                        {prompt}

                        Extracted Sections:
                        {json.dumps(section_texts, indent=2)}

                        If any section is missing its content or references another section for context, note that in your response.
                        Provide your answer in a clear and concise manner.
                        Provide your answer in markdown format.
                    """}]
                },
            ],
            inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0},
            additionalModelRequestFields={
                "reasoning_effort": "low"
            }
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
        # Send completion signal
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'complete'})
        )
    except Exception as e:
        print(f"Error in generate_response: {e}")
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'error', 'data': str(e)})
        )

def generate_multi_context_response(event, context):
    return asyncio.run(generate_multi_context_response_async(event, context))