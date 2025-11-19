import json
from user_auth import get_auth_header
from dynamo import get_item

def get_chatbot_status(event, context):
    query_params = event.get('queryStringParameters', {})
    auth_header = get_auth_header()
    
    try:
        job_id = query_params['jobId']
        response = get_item('conversation_jobs', {'job_id': job_id})
        return {
            'statusCode': 200,
            'body': json.dumps(response),
            'headers': auth_header
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Missing or invalid parameters: {str(e)}',
            'headers': auth_header
        }