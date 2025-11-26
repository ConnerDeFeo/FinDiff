import json
import boto3
from filings import section_order, fetch_10k_from_sec, parse_text_from_html, get_requested_section_summarization
from dynamo import put_item
import asyncio

async def upload_document_async(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    body = json.loads(event['body'])
    
    # Create API Gateway Management API client
    apigateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{domain_name}/{stage}")
    
    try:
        # Extract parameters from event
        cik = body["cik"]
        accession = body["accession"]
        primaryDoc = body["primaryDoc"]
        accession = accession.replace("-", "")

        sections = [data[0] for data in section_order]
        sections.pop() # Remove exhibits section

        url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{primaryDoc}"
        doc = await fetch_10k_from_sec(url)
        full_text = parse_text_from_html(doc)

        # Process uncached sections in parallel
        tasks = []
        for section in sections:
            raw_text_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}.txt"
            summary_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}_summary.txt"
            tasks.append(get_requested_section_summarization(full_text, section, raw_text_key, summary_key))
        completed_count = 0
        total_tasks = len(tasks)
        for coro in asyncio.as_completed(tasks):
            await coro
            completed_count += 1
            # Send progress update to client
            progress_message = {
                "type": "update",
                "completed": completed_count,
                "total": total_tasks
            }
            try:
                apigateway.post_to_connection(
                    Data=json.dumps(progress_message),
                    ConnectionId=connection_id
                )
            except apigateway.exceptions.GoneException:
                pass # Client disconnected, continue processing
        
        # Mark document as processed in DynamoDB
        put_item('processed_documents', {
            'document_id': f"{cik}_{accession}_{primaryDoc}",
            "status": "processed"
        })

        apigateway.post_to_connection(
            Data=json.dumps({
                "type": "complete",
                "message": "Document processing complete."
            }),
            ConnectionId=connection_id
        )
    except Exception as e:
        print(f"Error processing document: {e}")
        error_message = {
            "type": "error",
            "message": str(e)
        }
        apigateway.post_to_connection(
            Data=json.dumps(error_message),
            ConnectionId=connection_id
        )

def upload_document(event,context):
    return asyncio.run(upload_document_async(event,context))