import stripe
import os
from dynamo import get_item
import json
from user_auth import post_auth_header


stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

def create_portal_session(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']

    user = get_item("user_details", {"user_id": user_id})

    session = stripe.billing_portal.Session.create(
        customer=user["stripe_customer_id"],
        return_url="https://findiff.com/subscription-manager"
    )

    return {
        "statusCode": 200,
        "body": json.dumps({ "url": session.url }),
        "headers": post_auth_header
    }