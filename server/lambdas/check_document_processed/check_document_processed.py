import json
from dynamo import get_item
from user_auth import get_auth_header

def check_document_processed(event, context):
    query_params = event.get('queryStringParameters', {})

    try:
        cik = query_params['cik']
        accession = query_params['accession']
        primary_doc = query_params['primaryDoc']
        accession = accession.replace('-', '')

        # Check if the document has been processed
        response = get_item(
            table_name='processed_documents',
            key={'document_id': f"{cik}_{accession}_{primary_doc}"}
        )
        print(response)
        return {
            'statusCode': 200,
            'body': json.dumps({'processed': response is not None}),
            'headers': get_auth_header
        }
    except Exception as e:
        print(f"Error in check_document_processed: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': get_auth_header
        }