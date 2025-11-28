import json
from filings import get_multiple_10k_sections_async, get_relevant_sections
import boto3
import asyncio
import uuid
import time
from dynamo import query_items, put_item

OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

async def generate_response_async(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")

    try:
        # Extract parameters from event
        cik = body["cik"]
        accession = body["accession"]
        primaryDoc = body["primaryDoc"]
        prompt = body["prompt"]
        conversation_id = body.get("conversationId")
        print(f"Received request for CIK: {cik}, Accession: {accession}, Conversation ID: {conversation_id}")

        # create uuid if no conversation_id
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            conversation = []
        # Else fetch existing conversation from DynamoDB
        else:
            conversation = query_items("conversation_history", "conversation_id = :cid", {":cid": conversation_id})
            conversation = [item["message"] for item in conversation]
            print(f"Fetched existing conversation with {len(conversation)} messages.")

        # Parse user prompt to identify requested sections
        sections = get_relevant_sections(prompt).get("sections", [])
        summaires = await get_multiple_10k_sections_async(cik, accession.replace("-", ""), primaryDoc, sections)

        conversation.append(
            {
                "role": "user", 
                "content": [
                    {"text": f"""
                        You are an expert financial analyst.
                        Your job is to answer the question directly and completely. 
                        Sections of a 10-K filing have been extracted to help you answer the question. 
                                
                        Extracted Sections:
                        {json.dumps(summaires, indent=2)}

                        If any section is missing its content or references another section for context, 
                        note that in your response.
                        Provide your answer in markdown format. 
                    """},
                    {"text": f"""
                        #USER QUESTION:
                        {prompt}
                    """}
                ]
            }
        )

        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-20b-1:0",
            messages=conversation,
            inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0.75},
            additionalModelRequestFields={
                "reasoning_effort": "low"
            }
        )
        stream = response.get('stream')
        response = ""
        if stream:
            for stream_event in stream:
                if 'contentBlockDelta' in stream_event:
                    delta = stream_event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        text_chunk = delta['text']
                        response += text_chunk
                        apigateway.post_to_connection(
                            ConnectionId=connection_id,
                            Data=json.dumps({'type': 'chunk', 'data': text_chunk})
                        )
                        
                elif 'messageStop' in stream_event:
                    # Stream finished
                    break
        currentTime = int(time.time()*1000)  # current time in milliseconds
        # Store updated conversation in DynamoDB
        put_item("conversation_history", {
            "conversation_id": conversation_id,
            "timestamp": currentTime-1,
            "message": {"role": "user", "content": [{"text": prompt}]}
        })
        put_item("conversation_history", {
            "conversation_id": conversation_id,
            "timestamp": currentTime,
            "message": {"role": "assistant", "content": [{"text": response}]}
        })
        # Send completion signal
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'complete', 'id': conversation_id})
        )
    except Exception as e:
        print(f"Error in generate_response: {e}")
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'error', 'data': str(e)})
        )

def generate_response(event, context):
    return asyncio.run(generate_response_async(event, context))