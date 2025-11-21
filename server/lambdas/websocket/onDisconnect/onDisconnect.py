import json
from dynamo import delete_item

TABLE_NAME = 'websocket_connections'

def onDisconnect(event, context):
    connection_id = event['requestContext']['connectionId']

    try:
        delete_item(TABLE_NAME, {
            'connection_id': connection_id
        })
        return {
            'statusCode': 200,
            'body': json.dumps('Disconnected.')
        }
    except Exception as e:
        print(f"Error disconnecting: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Failed to disconnect: {str(e)}")
        }