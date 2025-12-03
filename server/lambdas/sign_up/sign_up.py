from dynamo import get_item, put_item
import json
from user_auth import post_auth_header

def sign_up(event, context):
    body = json.loads(event['body'])

    try:
        user_id = body['userId']

        existing_user = get_item('user_data', {'user_id': user_id})
        if existing_user:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'User already exists'}),
                'headers': post_auth_header
            }
        new_user = {
            'user_id': user_id,
        }
        put_item('user_data', new_user)

        return {
            'statusCode': 201,
            'headers': post_auth_header,
            'body': json.dumps({'message': 'User created successfully'})
        }
    except KeyError:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Invalid input'}),
            'headers': post_auth_header
        }