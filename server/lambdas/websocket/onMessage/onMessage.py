import json
import boto3

bedrock = boto3.client('bedrock-runtime')

def onMessage(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")
    
    try:
        body = json.loads(event['body'])
        user_message = body.get('message', '')
        
        # Call Bedrock with streaming
        response = bedrock.converse_stream(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": user_message}]
                },
            ],
            inferenceConfig={"maxTokens": 4000, "temperature": 0.75}
        )
        
        # Stream chunks back through WebSocket
        stream = response.get('stream')
        if stream:
            for stream_event in stream:
                if 'contentBlockDelta' in stream_event:
                    delta = stream_event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        text_chunk = delta['text']
                        # Send this chunk back through WebSocket
                        apigateway.post_to_connection(
                            ConnectionId=connection_id,
                            Data=json.dumps({'type': 'message', 'data': text_chunk})
                        )
                        
                elif 'messageStop' in stream_event:
                    # Stream finished
                    break
        
        # Send completion signal
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({'type': 'complete'})
        )
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        try:
            apigateway.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps({'type': 'error', 'message': str(e)})
            )
        except:
            pass
        return {'statusCode': 500}