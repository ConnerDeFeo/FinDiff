import json
from user_auth import post_auth_header
import uuid 
import boto3

lambda_client = boto3.client('lambda')

def generate_response(event, context):
    auth_header = post_auth_header()
    body = json.loads(event["body"])
    try:
        prompt = body["prompt"]
        cik = body["cik"]
        accession = body["accession"]
        primaryDoc = body["primaryDoc"]

        job_id = str(uuid.uuid4())

        # Invoke asynchronous embedding lambda
        embedding_payload = {
            "cik": cik,
            "accession": accession,
            "primaryDoc": primaryDoc,
            "prompt": prompt,
            "job_id": job_id
        }

        lambda_client.invoke(
            FunctionName='generate_response_worker',
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(embedding_payload)
        )
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                'headers': auth_header
            },
            "body": json.dumps(job_id)
        }
    except Exception as e:
        print(f"Error in generate_response: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                'headers': auth_header
            }
        }


