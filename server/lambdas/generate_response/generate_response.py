import json
from filings import get_10k_section_async, section_order, extract_text_from_bedrock_response
import boto3
import asyncio

OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def get_relevant_sections(prompt: str) -> dict:
    available_sections = [section[0] for section in section_order]
    response = bedrock.converse(
        modelId = "openai.gpt-oss-120b-1:0",
        messages=[
            {
                "role": "user", 
                "content": [{"text": f"""
                    You are an expert financial analyst. Based on the user prompt below,
                    identify up to three sections needed from a 10-K filing to best answer the prompt.
                    
                    User Prompt:
                    {prompt}
                    return your answer as a json object in the form:
                    {{
                        "sections": [list of sections from the following available sections: {', '.join(available_sections)}]
                    }}"""
                }]
            },
        ],
        inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
    )
    response = extract_text_from_bedrock_response(response)
    try:
        res = json.loads(response)
    except json.JSONDecodeError:
        res = {"sections": []}
    return res

async def generate_response_async(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")

    try:

        cik = body["cik"]
        accession = body["accession"]
        primaryDoc = body["primaryDoc"]
        prompt = body["prompt"]

        # Parse user prompt to identify requested sections
        sections = get_relevant_sections(prompt).get("sections", [])
        summaires = [
            get_10k_section_async(cik, accession.replace("-", ""), primaryDoc, section) 
            for section in sections
        ]
        section_texts = await asyncio.gather(*summaires)

        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": f"""
                        You are an expert financial analyst. Using the following extracted sections from a 10-K filing,
                        provide a detailed response to the user's prompt below.

                        User Prompt:
                        {prompt}

                        Extracted Sections:
                        {"\n".join([f"Section: {sections[i]}\nContent: {section_texts[i]}" for i in range(len(sections))])}

                        Provide your answer in a clear and concise manner.
                        Provide your answer in markdown format.
                    """}]
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

def generate_response(event, context):
    return asyncio.run(generate_response_async(event, context))