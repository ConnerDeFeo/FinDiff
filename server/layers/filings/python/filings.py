import asyncio
import json
import httpx
import re
from bs4 import BeautifulSoup
import boto3

# Configuration constants
MAX_SECTION_TOKENS = 100000  # Maximum tokens per section before splitting
OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
BUCKET_NAME = 'findiff-bucket-prod'
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')
s3 = boto3.client('s3')
# Define all 10-K sections in order with regex patterns
section_order = [
    # Part I
    ("business", r"Item\s+1\s*[\.:-]\s*Business"),
    ("risk_factors", r"Item\s+1A\s*[\.:-]\s*Risk Factors"),
    ("unresolved_staff_comments", r"Item\s+1B\s*[\.:-]\s*Unresolved Staff Comments"),
    ("cybersecurity", r"Item\s+1C\s*[\.:-]\s*Cybersecurity"),
    ("properties", r"Item\s+2\s*[\.:-]\s*Properties"),
    ("legal_proceedings", r"Item\s+3\s*[\.:-]\s*Legal Proceedings"),
    ("mine_safety", r"Item\s+4\s*[\.:-]\s*Mine Safety Disclosures"),
    # Part II
    ("market_for_registrants_common_equity", r"Part\s+(2|II)\s+Item\s+5\s*[\.:-]\s*Market\s+for\s+Registrant.s\s+Common\s+Equity"),
    ("selected_financial_data", r"Item\s+6\s*[\.:-]\s*Selected Financial Data"),
    ("managements_discussion_and_analysis", r"Item\s+7\s*[\.:-]\s*Management.s Discussion and Analysis"),
    ("quantitative_and_qualitative_disclosures", r"Item\s+7A\s*[\.:-]\s*Quantitative"),
    ("financial_statements_and_supplementary_data", r"Item\s+8\s*[\.:-]\s*Financial Statements and Supplementary Data"),
    ("changes_in_and_disagreements_with_accountants", r"Item\s+9\s*[\.:-]\s*Changes in and Disagreements"),
    ("controls_and_procedures", r"Item\s+9A\s*[\.:-]\s*Controls and Procedures"),
    ("other_information", r"Item\s+9B\s*[\.:-]\s*Other Information"),
    ("disclosures_regarding_foreign_jurisdictions", r"Item\s+9C\s*[\.:-]\s*Disclosure\sRegarding\sForeign\sJurisdictions"),
    # Part III
    ("directors_and_executive_officers", r"Part\s+(3|III)\s+Item\s+10\s*[\.:-]\s*Directors"),
    ("executive_compensation", r"Item\s+11\s*[\.:-]\s*Executive Compensation"),
    ("security_ownership", r"Item\s+12\s*[\.:-]\s*Security Ownership"),
    ("certain_relationships", r"Item\s+13\s*[\.:-]\s*Certain Relationships"),
    ("principal_accountant_fees", r"Item\s+14\s*[\.:-]\s*Principal Accountant"),
    ("exhibits", r"Part\s+(4|IV)\s+Item\s+15\s*[\.:-]\s*Exhibits"),
]

section_index = {name: idx for idx, (name, _) in enumerate(section_order)}
def exists(key: str) -> bool:
    try:
        s3.head_object(Bucket='findiff-bucket-prod', Key=key)
        return True
    except s3.exceptions.ClientError:
        return False
def put_object(key: str, data: bytes):
    s3.put_object(Bucket=BUCKET_NAME, Key=key, Body=data)
def get_object(key: str) -> bytes:
    response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
    return response['Body'].read()

async def bedrock_converse_async(**kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: bedrock.converse(**kwargs)
    )

async def fetch_10k_from_sec(url):
    """
    Asynchronously fetch a 10-K filing from the SEC EDGAR system.
    
    Args:
        url: The SEC EDGAR URL for the filing
        
    Returns:
        The HTML content as text, or None if the request fails
    """
    headers = {
        "User-Agent": "Conner DeFeo ninjanerozz@gmail.com"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=True)
        if response.status_code == 200:
            return response.text
        else:
            return None

def parse_text_from_html(html_content):
    """
    Parse and clean text from HTML content of a 10-K filing.
    
    Args:
        html_content: Raw HTML content of the 10-K filing
        
    Returns:
        Cleaned text extracted from the HTML
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style tags to clean up content
    for script in soup(["script", "style"]):
        script.decompose()
    
    # Get all text with newline separators
    text = soup.get_text(separator='\n', strip=True)
    return text

def get_requested_section(html_content, requested_section):
    """
    Extract a specific section from a 10-K filing HTML.
    
    Args:
        html_content: Raw HTML content of the 10-K filing
        requested_section: The section name to extract (e.g., 'business', 'risk_factors')
        
    Returns:
        Tuple of (section_text, token_count)
    """
    full_text = parse_text_from_html(html_content)

    start_index = section_index.get(requested_section)
    if start_index is None:
        return "", 0  # Section not found
    end_index = start_index + 1

    matches = list(re.finditer(section_order[start_index][1], full_text, re.IGNORECASE))
    if not matches:
        return "", 0
    section_start = matches[1].start() if len(matches) > 1 else matches[0].start()
    section_end = None

    # Find the start of the next section to determine the end of the current section
    while not section_end and end_index < len(section_order):
        matches = list(re.finditer(section_order[end_index][1], full_text, re.IGNORECASE))
        i = 0
        if matches:
            section_end = matches[0].start()
        while section_end is not None and i<len(matches) and section_end <= section_start:
            section_end = matches[i].start()
            i += 1
        if section_end is not None and section_end < section_start:
            section_end = None
        end_index += 1

    # Extract and return the section text with token estimate
    if section_start is not None and section_end is not None:
        section_text = full_text[section_start:section_end].strip()
        token_count = len(section_text) // 4  # Rough token estimate
        return section_text, token_count
    return "", 0

def extract_text_from_bedrock_response(response):
    """
    Extract text content from a Bedrock API response.
    
    Args:
        response: The response object from Bedrock converse API
        
    Returns:
        The extracted text or a default error message
    """
    content = response["output"]["message"]["content"]
    print("Usage: ", response.get("usage", {}))
    raw_text = "### No Text Generated\nNo summary was produced for this comparison:( Please try again."
    
    # Look for text in the content items
    for item in content:
        if "text" in item:
            raw_text = item["text"]
            break
    return raw_text 

async def summarize_section(text, text_tokens, section, summary_key):
    """
    Recursively summarize a section using Bedrock AI.
    If the section is too large, split it in half and summarize each part.
    
    Args:
        text: The section text to summarize
        text_tokens: Estimated token count of the text
        section: Section name for context
        summary_key: S3 key to cache the summary
        
    Returns:
        The summarized text
    """
    print(f"Summarizing section {section} with {text_tokens} tokens.")
    # If section is too large, split and recursively summarize
    if text_tokens > MAX_SECTION_TOKENS:
        print(f"Section too large ({text_tokens} tokens). Splitting and summarizing in parts.")
        midway = len(text) // 2
        # Add overlap to prevent losing context at split point
        tasks = []
        first_half = text[:midway + 100]
        second_half = text[midway - 100:]
        tasks.append(summarize_section(first_half, len(first_half.split()), section, summary_key + "_part1"))
        tasks.append(summarize_section(second_half, len(second_half.split()), section, summary_key + "_part2"))
        first_half, second_half = await asyncio.gather(*tasks)
        text = first_half + "\n\n" + second_half
    # Section is small enough, summarize directly
    response = await bedrock_converse_async(
        modelId = "openai.gpt-oss-20b-1:0",
        messages=[
            {
                "role": "user", 
                "content": [{"text": 
                    f"""
                        Create a detailed summary of this {section} section chunk from a 10K filing. 
                        Preserve ALL key facts, financial figures, risks, metrics, and business 
                        details. Do NOT shorten aggressively. Write a concise, comprehensive 
                        summary that retains all information from the {section} section in an organized form. 
                        This summary should be nearly lossless and allow another AI to 
                        reconstruct any part of the original content.

                        Section Text:
                        {text}
                    """
                }]
            },
        ],
        inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
    )
    response = extract_text_from_bedrock_response(response)
    
    # Cache the summary in S3
    put_object(summary_key, response.encode('utf-8'))
    return response

def get_relevant_sections(prompt: str) -> dict:
    available_sections = [section[0] for section in section_order]
    response = bedrock.converse(
        modelId = "openai.gpt-oss-20b-1:0",
        messages=[
            {
                "role": "user", 
                "content": [{"text": f"""
                    You are an expert financial analyst. Based on the user prompt below,
                    identify up to three sections needed from a 10-K filing to best answer the prompt.
                    
                    User Prompt:
                    {prompt}

                    return your answer as a json object in the form:
                    {{
                        "sections": [list of sections from the following available sections: {', '.join(available_sections)}]
                    }}"""
                }]
            },
        ],
        inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
    )
    response = extract_text_from_bedrock_response(response)
    print(f"get_relevant_sections response: {response}")
    clean = response.strip()
    clean = clean.replace("```json", "").replace("```", "").strip()
    try:
        res = json.loads(clean)
    except json.JSONDecodeError:
        res = {"sections": []}
    return res

async def get_10k_section_async(cik: str, accession: str, primaryDoc: str, section: str) -> str:
    """
    Fetch, parse, and summarize a specific section from a 10-K filing.
    Uses caching to avoid re-processing the same filing.
    
    Args:
        cik: Company CIK number
        accession: Filing accession number (without hyphens)
        primaryDoc: Primary document filename
        section: Section name to extract
        
    Returns:
        The summarized section text
    """
    # Define S3 cache keys
    raw_text_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}.txt"
    summary_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}_summary.txt"
    
    # Return cached summary if it exists
    if exists(summary_key):
        return get_object(summary_key).decode('utf-8')
    
    # Fetch the filing from SEC
    url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{primaryDoc}"
    doc = await fetch_10k_from_sec(url)
    if not doc:
        raise ValueError("Could not fetch 10-K filing from SEC.")
    
    # Extract the requested section
    text, tokens = get_requested_section(doc, section)
    put_object(raw_text_key, text.encode('utf-8'))
    
    # Summarize the section
    summarization = await summarize_section(text, tokens, section, summary_key)

    return summarization