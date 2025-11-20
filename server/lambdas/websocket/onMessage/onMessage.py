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
        response = bedrock.invoke_model_with_response_stream(
            modelId='anthropic.claude-sonnet-4-20250514',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 4096,
                'messages': [{'role': 'user', 'content': user_message}]
            })
        )
        
        # Stream chunks back through WebSocket
        for event in response['body']:
            chunk = json.loads(event['chunk']['bytes'])
            
            if chunk['type'] == 'content_block_delta':
                text = chunk['delta'].get('text', '')
                
                # Send chunk to client
                apigateway.post_to_connection(
                    ConnectionId=connection_id,
                    Data=json.dumps({'type': 'chunk', 'text': text})
                )
        
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