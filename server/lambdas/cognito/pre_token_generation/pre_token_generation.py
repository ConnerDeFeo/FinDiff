from dynamo import get_item

def pre_token_generation(event, context):
    is_premium = False
    user_id = event["request"]["userAttributes"]["sub"]
    item = get_item("user_details", {"user_id": user_id} )
    print("DynamoDB item:", item)
    if item and item.get("subscription_status") == "active":
        is_premium = True

    event["response"]["claimsOverrideDetails"] = {
        "claimsToAddOrOverride": {
            "custom:isPremium": "true" if is_premium else "false"
        }
    }

    return event