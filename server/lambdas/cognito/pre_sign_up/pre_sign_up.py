def pre_sign_up(event, context):
    print('Pre Sign Up:', event)
    
    # Auto-confirm the user
    event['response']['autoConfirmUser'] = True
    event['response']['autoVerifyEmail'] = True
    
    return event