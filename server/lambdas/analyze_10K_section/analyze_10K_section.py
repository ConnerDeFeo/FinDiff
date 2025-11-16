import json
import boto3
import uuid
from user_auth import post_auth_header
from dynamo import put_item

lambda_client = boto3.client('lambda')

def analyze_10k_section(event, context):
    body = json.loads(event['body'])
    auth_header = post_auth_header()

    try:
        stock = body['stock']  # Expecting {accessionNumber, cik, primaryDocument}
        section = body['section'] # Section to compare

        if not section:
            raise ValueError("Section parameter is required")

        # Create job ID
        job_id = str(uuid.uuid4())
        
        # Store initial job status
        put_item('single_section_analysis_jobs', {
            'job_id': job_id,
            'status': 'PROCESSING',
        })
        
        # Invoke async worker Lambda
        lambda_client.invoke(
            FunctionName='analyze_10k_section_worker',
            InvocationType='Event',
            Payload=json.dumps({
                'jobId': job_id,
                'stock': stock,
                'section': section
            })
        )
        
        return {
            'statusCode': 202,  # Accepted
            'headers': auth_header,
            'body': json.dumps(job_id)
        }
    except Exception as e:
        print(f"Error in compare_10k_filings: {str(e)}")
        return {
            'statusCode': 500,
            'headers': auth_header,
            'body': json.dumps({'error': f'Missing parameter: {str(e)}'})
        }