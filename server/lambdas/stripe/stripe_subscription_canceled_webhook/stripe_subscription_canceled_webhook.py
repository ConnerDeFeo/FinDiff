import stripe
from dynamo import update_item, get_item
import json
import os

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
WEBHOOK_SECRET = os.environ.get('STRIPE_SUBSCRIPTION_CANCELED_WEBHOOK_SECRET')

def stripe_subscription_canceled_webhook(event, context):
    try:
        payload = event["body"]
        headers = event.get('headers', {})
        sig_header = headers.get('Stripe-Signature')

        try:
            stripe_event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=WEBHOOK_SECRET
            )
        except Exception:
            # Invalid signature
            return {
                "statusCode": 400,
                "body": "Invalid signature"
            }
        # Handle subscription deletion
        if stripe_event["type"] == "customer.subscription.updated":
            subscription = stripe_event["data"]["object"]

            customer_id = subscription["customer"]
            cancel_at_period_end = subscription["cancel_at"] is not None

            response = get_item(
                table_name="stripe_customers",
                key={"stripe_customer_id": customer_id}
            )

            cognito_user_id = response.get("cognito_user_id")

            update_item(
                table_name="user_details",
                key={"user_id": cognito_user_id},
                update_expression="SET cancel_at_period_end = :cpe",
                expression_attribute_values={":cpe": cancel_at_period_end}
            )

        return {
            "statusCode": 200,
            "body": json.dumps({"status": "success"})
        }
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            "statusCode": 500,
            "body": "Internal server error"
        }