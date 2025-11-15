import boto3

_s3 = boto3.client('s3')
BUCKET_NAME = 'findiff-bucket-prod'

def exists(key: str) -> bool:
    try:
        _s3.head_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except _s3.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        else:
            raise

def put_object(key: str, data: bytes):
    _s3.put_object(Bucket=BUCKET_NAME, Key=key, Body=data)

def get_object(key: str) -> bytes:
    response = _s3.get_object(Bucket=BUCKET_NAME, Key=key)
    return response['Body'].read()