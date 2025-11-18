from pinecone_utils import embed_document
import json
from user_auth import post_auth_header
from dynamo import update_item
from filings import parse_text_from_html, fetch_10k_from_sec

async def generate_response_worker(event, context):
    auth_header = post_auth_header()
    try:
        cik = event["cik"]
        accession = event["accession"]
        primaryDoc = event["primaryDoc"]
        prompt = event["prompt"]
        job_id = event["job_id"]

        doc = fetch_10k_from_sec(f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession.replace('-', '')}/{primaryDoc}")
        text = parse_text_from_html(doc)

        # Call the embedding function
        await embed_document(cik, accession, primaryDoc, text)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                'headers': auth_header
            },
            "body": json.dumps({"message": "Embedding process started", "job_id": job_id})
        }
    except Exception as e:
        print(f"Error in generate_response_worker: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                'headers': auth_header
            }
        }