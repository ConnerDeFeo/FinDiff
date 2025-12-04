def verify_auth_challenge(event, context):
    print('Verify Auth Challenge:', event)
    
    # Get the expected answer
    expected_answer = event['request']['privateChallengeParameters']['answer']
    
    # Get what the user entered
    user_answer = event['request']['challengeAnswer']
    
    # Compare them
    event['response']['answerCorrect'] = (expected_answer == user_answer)
    
    print(f"Expected: {expected_answer}, Got: {user_answer}, Match: {event['response']['answerCorrect']}")
    
    return event