import json
import stripe
import os
from dynamo import update_item, put_item
from datetime import datetime, timezone

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
webhook_secret = os.environ.get('STRIPE_COMPLETED_CHECKOUT_WEBHOOK_SECRET')

def stripe_completed_checkout_webhook(event, context):
    try:
        # Get the webhook payload
        payload = event['body']
        # API Gateway can pass headers in different formats
        headers = event.get('headers', {})
        sig_header = headers.get('Stripe-Signature')
        
        # Verify the webhook signature
        if sig_header and webhook_secret:
            try:
                stripe_event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except Exception as e:
                print(f"Webhook signature verification failed: {str(e)}")
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid signature'})
                }
        else:
            print("No signature verification - parsing event directly")
            stripe_event = json.loads(payload)
        
        # Handle the event
        if stripe_event['type'] == 'checkout.session.completed':
            session = stripe_event['data']['object']
            
            # Get important info
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            cognito_user_id = session.get('metadata', {}).get('cognito_user_id')

            subscription = stripe.Subscription.retrieve(subscription_id)
            next_billing_ts = subscription["items"]["data"][0]["current_period_end"]
            next_billing = datetime.fromtimestamp(next_billing_ts, timezone.utc).isoformat().split("T")[0]
        
            update_item(
                table_name="user_details", 
                key={"user_id": cognito_user_id}, 
                update_expression="""
                    SET stripe_customer_id = :cid, 
                    stripe_subscription_id = :sid, 
                    subscription_status = :status, 
                    subscription_tier = :tier,
                    next_billing_date = :nbd,
                    cancel_at_period_end = :cpe
                """,
                expression_attribute_values = {
                    ":cid": customer_id, 
                    ":sid": subscription_id, 
                    ":status": "active", 
                    ":tier": "premium",
                    ":nbd": next_billing,
                    ":cpe": False
                },
            )

            # Add the stripe customer id to the stripe_customers table
            put_item(
                table_name="stripe_customers",
                item={
                    "stripe_customer_id": customer_id,
                    "cognito_user_id": cognito_user_id,
                }
            )
            
        return {
            'statusCode': 200,
            'body': json.dumps({'received': True})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }