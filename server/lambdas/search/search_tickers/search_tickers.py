import json
import os
from user_auth import get_auth_header

TICKER_FILE = os.path.join(os.path.dirname(__file__), 'tickers.json')
with open(TICKER_FILE) as f:
    ALL_TICKERS = json.load(f)
print(f"Loaded {len(ALL_TICKERS)} tickers.")

def search_tickers(event, context):
    query = event.get('queryStringParameters', {})
    auth_header = get_auth_header()

    try:
        search_term = query.get('q', '').upper()
        if not search_term:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Query parameter "q" is required.'}),
                'headers': auth_header
            }
        # Search for tickers that match the search term
        results = []
        for item in ALL_TICKERS.values():
            ticker = item.get('ticker', '')
            title = item.get('title', '')
            cik_str = item.get('cik_str', '')
            if search_term in ticker.upper() or search_term in title.upper():
                results.append({
                    'cik_str': cik_str,
                    'ticker': ticker,
                    'title': title
                })
        return {
            'statusCode': 200,
            'body': json.dumps(results[:10]),  # return top 10 results
            'headers': auth_header
        }
    except Exception as e:
        print("Error in search_tickers:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)}),
            'headers': auth_header
        }