import json
from filings import put_object
from user_auth import get_auth_header

def cache_available_10k_filings(event, context):
    auth_header = get_auth_header()

    try:
        cik = event["cik"]
        data = event["data"]

        put_object(f"search_cache/10k_filings/{cik}.json", json.dumps(data).encode('utf-8'))

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "10-K filings cached successfully."}),
            "headers": auth_header
        }
    except Exception as e:
        print(f"Error caching 10-K filings: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": auth_header
        }