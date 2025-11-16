import json
import requests
from user_auth import get_auth_header

def get_available_10k_filings(event, context):
    query = event.get("queryStringParameters", {}) or {}
    auth_header = get_auth_header()

    try:
        cik = query["cik"]
        headers = {
            'User-Agent': 'Conner DeFeo ninjanerozz@gmail.com'
        }

        cik_padded = cik.zfill(10)
        ten_k_filings = []

        response = requests.get(f"https://data.sec.gov/submissions/CIK{cik_padded}.json", headers=headers)
        data = response.json()

        filings = data.get('filings', {})
        recent = filings.get('recent', {})
        def append_10k_filings(data):
            for i, form in enumerate(data.get('form', [])):
                if form == '10-K':
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