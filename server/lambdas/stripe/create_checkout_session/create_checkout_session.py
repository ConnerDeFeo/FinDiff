import json
import stripe
import os
from user_auth import post_auth_header

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
PRICE_ID = os.environ["FINDIFF_PREMIUM_PRICE_KEY"]

def create_checkout_session(event, context):
    try:
        user_id = event['requestContext']['authorizer']['claims']['email']
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": PRICE_ID, "quantity": 1}],
            success_url="http://findiff.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://findiff.com/cancel",
            metadata={"cognito_user_id": user_id}
        )

        return {
            "statusCode": 200,
            "headers": post_auth_header,
            "body": json.dumps({"url": session.url})
        }
    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        return {
            "statusCode": 500,
            "headers": post_auth_header,
            "body": json.dumps({"error": str(e)})
        }