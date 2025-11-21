import json
import time
from dynamo import put_item

TABLE_NAME = 'websocket_connections'

def onConnect(event, context):
    connection_id = event['requestContext']['connectionId']

    try:
        put_item(TABLE_NAME, {
            'connection_id': connection_id,
            'connected_at': int(time.time())
        })
        return {
            'statusCode': 200,
            'body': json.dumps('Connected.')
        }
    except Exception as e:
        print(f"Error connecting: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Failed to connect: {str(e)}")
        }