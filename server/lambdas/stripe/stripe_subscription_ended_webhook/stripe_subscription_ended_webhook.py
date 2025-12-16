from dynamo import update_item, get_item
import os
import stripe
import json

stripe.api_key = os.environ['STRIPE_API_KEY']
WEBHOOK_SECRET = os.environ['STRIPE_SUBSCRIPTION_ENDED_WEBHOOK_SECRET']

def stripe_subscription_ended_webhook(event, context):
    payload = event["body"]
    sig_header = event["headers"].get("stripe-signature") or event["headers"].get("Stripe-Signature")

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
    if stripe_event["type"] == "customer.subscription.deleted":
        session = stripe_event['data']['object']

        customer_id = session.get('customer')

        # Get the cognito_user_id from the dynamo table
        response = get_item(
            table_name="stripe_customers",
            key={"stripe_customer_id": customer_id}
        )

        cognito_user_id = response.get('cognito_user_id')
        # update user details table setting subscription_status to "inactive"
        update_item(
            table_name="user_details",
            key={"user_id": cognito_user_id},
            update_expression="SET subscription_status = :status",
            expression_attribute_values={":status": "inactive"}
        )

    return {
        'statusCode': 200,
        'body': json.dumps({'received': True})
    }