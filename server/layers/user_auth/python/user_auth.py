import requests
from jose import jwt

def authorize_token(token):
    try:      
        # Cognito settings
        region = 'us-east-2'
        user_pool_id = 'us-east-2_qohaO7d2p'
        app_client_id = '723smam9e9jn56op1r7740tbh1'
        
        # Get JWKs from Cognito
        keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        response = requests.get(keys_url)
        keys = response.json()['keys']
        
        # Get kid from token header
        headers = jwt.get_unverified_headers(token)
        kid = headers['kid']
        
        # Find the correct key
        key = next((k for k in keys if k['kid'] == kid), None)
        if not key:
            return None
        
        # Verify and decode token
        decoded = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=app_client_id,
            issuer=f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}',
            options={'verify_at_hash': False}
        )
        
        return decoded
        
    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        return None


get_auth_header = {
        "Access-Control-Allow-Origin": "*",  # Allow from any origin
        "Access-Control-Allow-Methods": "GET, OPTIONS",  # Allow specific methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization"  # Allow specific headers
    }
    
post_auth_header= {
        "Access-Control-Allow-Origin": "*",  # Allow from any origin
        "Access-Control-Allow-Methods": "POST, OPTIONS",  # Allow specific methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization"  # Allow specific headers
    }

put_auth_header = {
        "Access-Control-Allow-Origin": "*",  # Allow from any origin
        "Access-Control-Allow-Methods": "PUT, OPTIONS",  # Allow specific methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization"  # Allow specific headers
    }

delete_auth_header = {
        "Access-Control-Allow-Origin": "*",  # Allow from any origin
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",  # Allow specific methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization"  # Allow specific headers
    }