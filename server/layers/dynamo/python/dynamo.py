import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')

def get_item(table_name: str, key: dict):
    table = dynamodb.Table(table_name) # type: ignore
    response = table.get_item(Key=key)
    return response.get('Item')

def put_item(table_name: str, item: dict):
    table = dynamodb.Table(table_name) # type: ignore
    table.put_item(Item=item)

def update_item(table_name: str, key: dict, update_expression: str, expression_attribute_values: dict):
    table = dynamodb.Table(table_name) # type: ignore
    table.update_item(
        Key=key,
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values
    )

def delete_item(table_name: str, key: dict):
    table = dynamodb.Table(table_name) # type: ignore
    table.delete_item(Key=key)

def query_items(table_name: str, key_condition_expression, expression_attribute_values: dict, ScanIndexForward: bool = True):
    table = dynamodb.Table(table_name) # type: ignore
    response = table.query(
        KeyConditionExpression=key_condition_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ScanIndexForward=ScanIndexForward
    )
    return response.get('Items', [])

def can_access_features(user_id: str):
    today = datetime.now().date().isoformat()

    # Check if user has any free actions left for today
    table = dynamodb.Table("free_user_actions") # type: ignore
    response = table.get_item(
        Key={
            "user_id": user_id,
            "day": today
        }
    )
    item = response.get('Item')
    if not item:
        put_item("free_user_actions", {
            "user_id": user_id,
            "day": today,
            "actions_left": 9,
            "ttl": int((datetime.now().replace(hour=23, minute=59, second=59) + timedelta(seconds=1)).timestamp())
        })
        return True
    elif item.get("actions_left", 0) > 0:
        update_item("free_user_actions", 
                    {"user_id": user_id, "day": today}, 
                    "SET actions_left = actions_left - :val", 
                    {":val": 1})
        return True
    return False