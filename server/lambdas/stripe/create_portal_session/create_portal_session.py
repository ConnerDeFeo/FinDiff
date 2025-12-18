import stripe
import os
from dynamo import get_item
import json
from user_auth import post_auth_header


stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

def create_portal_session(event, context):
    try:
        user_id = event['requestContext']['authorizer']['claims']['email']

        user = get_item("user_details", {"user_id": user_id})

        session = stripe.billing_portal.Session.create(
            customer=user["stripe_customer_id"],
            return_url="http://localhost:5173/subscription-manager"
        )

        return {
            "statusCode": 200,
            "body": json.dumps({ "url": session.url }),
            "headers": post_auth_header
        }
    except Exception as e:
        print(f"Error creating portal session: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({ "error": "Internal Server Error: " + str(e) }),
            "headers": post_auth_header
        }