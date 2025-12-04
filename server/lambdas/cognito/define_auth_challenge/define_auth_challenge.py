def define_auth_challenge(event, context):
    print('Define Auth Challenge:', event)
    
    session = event['request']['session']
    
    if len(session) == 0:
        # First attempt - send custom challenge
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
        event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
    elif (
        len(session) == 1 and
        session[0]['challengeName'] == 'CUSTOM_CHALLENGE' and
        session[0]['challengeResult'] == True
    ):
        # User provided correct answer - issue tokens
        event['response']['issueTokens'] = True
        event['response']['failAuthentication'] = False
    else:
        # Wrong answer or too many attempts
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = True
    
    return event