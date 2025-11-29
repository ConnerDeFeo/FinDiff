import json
import requests
from user_auth import get_auth_header
from filings import exists, get_object
import boto3
from datetime import datetime

lambda_client = boto3.client('lambda')

def get_available_10k_filings(event, context):
    query = event.get("queryStringParameters", {}) or {}
    auth_header = get_auth_header()

    try:
        cik = query["cik"]
        headers = {
            'User-Agent': 'Conner DeFeo ninjanerozz@gmail.com'
        }

        cik_padded = cik.zfill(10)
        date = datetime.now().strftime("%Y-%m-%d")
        
        if exists(f"search_cache/10k_filings/{cik_padded}.json"):
            cached_data = get_object(f"search_cache/10k_filings/{cik_padded}.json")
            ten_k_filings = json.loads(cached_data)
            if 'ttl' in ten_k_filings and ten_k_filings['ttl'] == date:
                return {
                    "statusCode": 200,
                    "body": json.dumps(ten_k_filings['filings']),
                    "headers": auth_header
                }
        ten_k_filings = []

        response = requests.get(f"https://data.sec.gov/submissions/CIK{cik_padded}.json", headers=headers)
        data = response.json()

        filings = data.get('filings', {})
        recent = filings.get('recent', {})
        def append_10k_filings(data):
            for i, form in enumerate(data.get('form', [])):
                if form == '10-K' and data['primaryDocument'][i] != "":
                    filing_info = {
                        'accessionNumber': data['accessionNumber'][i],
                        'filingDate': data['filingDate'][i],
                        'primaryDocument': data['primaryDocument'][i],
                    }
                    ten_k_filings.append(filing_info)
        append_10k_filings(recent)
        
        if "files" in filings:
            for next_file in filings["files"]:
                if "name" in next_file:
                    file_response = requests.get(f"https://data.sec.gov/submissions/{next_file['name']}", headers=headers)
                    file_data = file_response.json()
                    append_10k_filings(file_data or {})
        
        lambda_client.invoke(
            FunctionName='cache_available_10k_filings',
            InvocationType='Event',
            Payload=json.dumps({
                'cik': cik_padded,
                'data': {'ttl': date, 'filings': ten_k_filings}
            })
        )
                    
        return {
            "statusCode": 200,
            "body": json.dumps(ten_k_filings),
            "headers": auth_header
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal Server Error: {e}"}),
            "headers": auth_header
        }