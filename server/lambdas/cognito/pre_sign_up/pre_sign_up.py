import json
import boto3

cognito = boto3.client('cognito-idp')
USER_POOL_ID = 'us-east-2_qohaO7d2p'

def pre_sign_up(event, context):
    # Auto-confirm the user
    event['response']['autoConfirmUser'] = True
    event['response']['autoVerifyEmail'] = True

    username = event['userName']
    user_attrs = event['request']['userAttributes']
    email = user_attrs.get('email')

    if not email:
        print("No email found; skipping merge")
        return event

    # Only run for federated logins
    if event['triggerSource'] != "PreSignUp_ExternalProvider":
        return event

    # Detect Google login via userName prefix
    if not username.startswith("Google_"):
        print("Not a Google login; skipping merge")
        return event

    federated_sub = username[len("Google_"):]  # Extract Google user ID
    provider_name = "Google"

    # Look for existing SSO/email user
    try:
        response = cognito.list_users(
            UserPoolId=USER_POOL_ID,
            Filter=f'email = "{email}"'
        )
        users = response.get('Users', [])

        if not users:
            print("No existing SSO/email user found for email:", email)
        else:
            existing_user = users[0]
            existing_username = existing_user['Username']

            # Link the new federated user to the existing SSO/email user
            cognito.admin_link_provider_for_user(
                UserPoolId=USER_POOL_ID,
                SourceUser={
                    'ProviderName': provider_name,
                    'ProviderAttributeName': 'Cognito_Subject',
                    'ProviderAttributeValue': federated_sub
                },
                DestinationUser={
                    'ProviderName': 'Cognito',
                    'ProviderAttributeName': 'Username',
                    'ProviderAttributeValue': existing_username
                }
            )
            print(f"Linked Google federated user {federated_sub} to existing SSO user {existing_username}")

    except Exception as e:
        print("Error linking federated user:", e)

    return event