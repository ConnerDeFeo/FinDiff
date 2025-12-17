import jwt
from jwt import PyJWKClient

def generate_policy(principal_id, effect, resource):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }]
        },
        'context': {
            'userId': principal_id
        }
    }

def findiff_lambda_authorizer(event, context):
    token = event['queryStringParameters']['token']
    # Your Cognito User Pool details
    region = 'us-east-2'
    user_pool_id = 'us-east-2_qohaO7d2p'
    app_client_id = '723smam9e9jn56op1r7740tbh1'
    
    # Construct the JWKs URL
    keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
    
    try:
        # Verify the token
        jwks_client = PyJWKClient(keys_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256'],
            audience=app_client_id
        )
        
        # Return allow policy
        return generate_policy(decoded['sub'], 'Allow', event['methodArn'])
        
    except Exception as e:
        print(f"Error: {e}")
        return generate_policy('user', 'Deny', event['methodArn'])