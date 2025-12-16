import json
from dynamo import get_item
from user_auth import get_auth_header

# Check if the current user is subscribed to a plan
def check_subscription(event, context):
    try:
        user_id = event['requestContext']['authorizer']['claims']['sub']

        # Get the sub data from dynamo
        user_data = get_item(
            table_name="user_details",
            key={"user_id": user_id}
        )

        if user_data is None or "subscription_status" not in user_data:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'}),
                'headers': get_auth_header
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                "subscription_active": user_data["subscription_status"] == "active", 
                "next_billing_date": user_data.get("next_billing_date"),
                "cancel_at_period_end": user_data.get("cancel_at_period_end")
            }),
            'headers': get_auth_header
        }
    
    except Exception as e:
        print(f"Error extracting user ID: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error: ' + str(e)}),
            'headers': get_auth_header
        }