import boto3
import random

ses = boto3.client('ses')

def create_auth_challenge(event, context):
    print('Create Auth Challenge:', event)
    
    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    
    # Store code in private challenge parameters
    event['response']['privateChallengeParameters'] = {
        'answer': code
    }
    
    # Metadata sent to client
    event['response']['challengeMetadata'] = 'CODE_CHALLENGE'
    
    email = event['request']['userAttributes']['email']
    from_address = "noreply@findiff.com"
    
    try:
        ses.send_email(
            Source=from_address,
            Destination={
                'ToAddresses': [email]
            },
            Message={
                'Subject': {
                    'Data': 'Your verification code'
                },
                'Body': {
                    'Html': {
                        'Data': f'''
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2>Your verification code</h2>
                                <p>Enter this code to sign in:</p>
                                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px;">
                                    {code}
                                </div>
                                <p style="color: #666; margin-top: 20px;">This code will expire in 5 minutes.</p>
                            </div>
                        '''
                    },
                    'Text': {
                        'Data': f'Your verification code is: {code}\n\nThis code will expire in 5 minutes.'
                    }
                }
            }
        )
        print(f'Email sent successfully to: {email}')
    except Exception as error:
        print(f'Error sending email: {error}')
        raise error
    
    return event