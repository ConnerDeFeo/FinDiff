import httpx
import re
from bs4 import BeautifulSoup
from dynamo import update_item
import boto3
from s3 import put_object, get_object, exists
import asyncio

MAX_SECTION_TOKENS = 100000
OUTPUT_TOKENS = 8000
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
# Fetch 10-K filing from SEC EDGAR
async def fetch_10k_from_sec(url):
    headers = {
        "User-Agent": "Conner DeFeo ninjanerozz@gmail.com"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=True)
        if response.status_code == 200:
            return response.text
        else:
            return None

def parse_html_to_text(html_content, requested_section):
    """
    Extract key sections from a 10-K filing
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style tags
    for script in soup(["script", "style"]):
        script.decompose()
    # Get all text
    full_text = soup.get_text(separator='\n', strip=True)
    
    # Define the section patterns to look for
    section_patterns = {
        # Part I
        "risk_factors": r"Item\s+1A\s*[\.:-]\s*Risk Factors",
        "unresolved_staff_comments": r"Item\s+1B\s*[\.:-]\s*Unresolved Staff Comments",
        "cybersecurity": r"Item\s+1C\s*[\.:-]\s*Cybersecurity",
        "properties": r"Item\s+2\s*[\.:-]\s*Properties",
        "legal_proceedings": r"Item\s+3\s*[\.:-]\s*Legal Proceedings",
        "mine_safety": r"Item\s+4\s*[\.:-]\s*Mine Safety Disclosures",

        # Part II
        "market_for_registrants_common_equity": r"Part\s+(2|II)\s+Item\s+5\s*[\.:-]\s*Market\s+for\s+Registrant.s\s+Common\s+Equity",
        "selected_financial_data": r"Item\s+6\s*[\.:-]\s*Selected Financial Data",
        "managements_discussion_and_analysis": r"Item\s+7\s*[\.:-]\s*Management.s Discussion and Analysis of Financial Condition and Results of Operations",

        "quantitative_and_qualitative_disclosures": r"Item\s+7A\s*[\.:-]\s*Quantitative",

        "financial_statements_and_supplementary_data": r"Item\s+8\s*[\.:-]\s*Financial Statements and Supplementary Data",
        "changes_in_and_disagreements_with_accountants": r"Item\s+9\s*[\.:-]\s*Changes in and Disagreements with Accountants on Accounting and Financial Disclosure",
        "controls_and_procedures": r"Item\s+9A\s*[\.:-]\s*Controls and Procedures",
        "other_information": r"Item\s+9B\s*[\.:-]\s*Other Information",
        "disclosures_regarding_foreign_jurisdictions_that_prevent_inspection": r"Item\s+9C\s*[\.:-]\s*Disclosure\sRegarding\sForeign\sJurisdictions\sThat\sPrevent\sInspections",

        # Part III
        "directors_and_executive_officers": r"Part\s+(3|III)\s+Item\s+10\s*[\.:-]\s*Directors, Executive Officers,* and Corporate Governance",
        "executive_compensation": r"Item\s+11\s*[\.:-]\s*Executive Compensation",
        "security_ownership_of_certain_beneficial_owners_and_management": r"Item\s+12\s*[\.:-]\s*Security Ownership of Certain Beneficial Owners and Management",
        "certain_relationships_and_related_transactions": r"Item\s+13\s*[\.:-]\s*Certain Relationships and Related Transactions",
        "principal_accountant_fees_and_services": r"Item\s+14\s*[\.:-]\s*Principal Accountant Fees and Services",

        # Part IV
        "exhibits_and_financial_statement_schedules": r"Part\s+(4|IV)\s+Item\s+15\s*[\.:-]\s*Exhibits(,*| and) Financial Statement Schedules",
    }
    prev  = list(re.finditer(r"(Item)\s+1\s*[\.:-]\s*(Business)", full_text, re.IGNORECASE))
    if not prev:
        raise ValueError("Could not find the Business section in the filing.")
    currentMatch = prev[0] if len(prev) == 1 else prev[1] # ignore heading
    currentTitle = "business"
    for key, pattern in section_patterns.items():
        section_matches = list(re.finditer(pattern, full_text, re.IGNORECASE))
        # Older fililngs do not have certain sections
        if not section_matches:
            print(f"Section {key} not found in filing.")
            continue
        section_match = section_matches[0] if len(section_matches) == 1 else section_matches[-1]  # ignore all but last finding
        if currentTitle == requested_section: 
            start_pos = currentMatch.end()
            end_pos = section_match.start()
            if start_pos >= end_pos:
                continue # skip invalid sections
            section_text = full_text[start_pos:end_pos].strip()
            return section_text, len(section_text) / 4

        currentTitle, currentMatch = key, section_match
    raise ValueError(f"Requested section '{requested_section}' not found in filing.")

def extract_text_from_bedrock_response(response):
    content = response["output"]["message"]["content"]
    print("Usage: ", response.get("usage", {}))
    raw_text = "### No Text Generated\nNo summary was produced for this comparison:( Please try again."
    for item in content:
        if "text" in item:
            raw_text = item["text"]
            break
    return raw_text 

async def summarize_section(text, text_tokens, section, summary_key):
    if text_tokens > MAX_SECTION_TOKENS:
        midway = len(text) // 2
        first_half = text[:midway+100]
        second_half = text[midway-100:]
        response = f"{await summarize_section(first_half, len(first_half) / 4, section, summary_key)}\n\n{await summarize_section(second_half, len(second_half) / 4, section, summary_key)}"

    else:
        response = bedrock.converse(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            Create a detailed summary of this {section} section chunk from a 10K filing. 
                            Preserve ALL key facts, financial figures, risks, metrics, and business 
                            details. Do NOT shorten aggressively. Write a concise, comprehensive 
                            summary that retains all information in an organized form. 
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
        put_object(summary_key, response.encode('utf-8'))
    return response

async def get_10k_section_async(cik: str, accession: str, primaryDoc: str, section: str) -> str:
    raw_text_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}.txt"
    summary_key = f"10k_filings_analysis/{cik}/{accession}/{primaryDoc}/{section}_summary.txt"
    if exists(summary_key):
        return get_object(summary_key).decode('utf-8')
    url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{primaryDoc}"
    doc = await fetch_10k_from_sec(url)
    if not doc:
        raise ValueError("Could not fetch 10-K filing from SEC.")
    text, tokens = parse_html_to_text(doc, section)
    summarization = await summarize_section(text, tokens, section, summary_key)
    if tokens > MAX_SECTION_TOKENS:
        text = summarization
    put_object(raw_text_key, text.encode('utf-8'))
    print("COMPLETED", section)
    return summarization

async def compare_10k_filings_worker_async(event, context):
    # Helper to update job status
    def update_job_status(result, status):
        update_item(
            'comparison_jobs',
            key={'job_id': job_id},
            update_expression='SET #status = :status, #result = :result',
            expression_attribute_names={'#status': 'status', "#result": "result"},
            expression_attribute_values={
                ':status': status,
                ':result': result
            }
        )

    def update_job_progress(progress):
        update_item(
            'comparison_jobs',
            key={'job_id': job_id},
            update_expression='SET #progress = :progress',
            expression_attribute_names={'#progress': 'progress'},
            expression_attribute_values={':progress': progress}
        )

    try:
        stock1 = event['stock1']
        stock2 = event['stock2']
        job_id = event['jobId']
        section = event['section']

        cik1 = stock1['cik']
        accession1 = stock1['accessionNumber']
        accession1 = accession1.replace('-', '')
        primaryDoc1 = stock1['primaryDocument']

        cik2 = stock2['cik']
        accession2 = stock2['accessionNumber']
        accession2 = accession2.replace('-', '')
        primaryDoc2 = stock2['primaryDocument']

        if cik1 != cik2:
            update_job_status("The two filings belong to different companies (CIKs do not match).", "FAILED")
            return

        update_job_progress("Fetching and analyzing sections from filings...")
        old_text, new_text = await asyncio.gather(
            get_10k_section_async(cik1, accession1, primaryDoc1, section),
            get_10k_section_async(cik2, accession2, primaryDoc2, section)
        )

        if not old_text or not new_text:
            update_job_status("Could not extract the requested section from one or both filings.", "FAILED")
            return
        update_job_progress("Compareing sections and generating insights...")
        response = bedrock.converse(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            You are a value investor analyzing 10-K changes for certain sections.
                            Your goal is to return a marked-down formatted summary of key insights from the changes between the two filings.

                            RULES:
                            - Separate insights by section, with a heading (h2) for each section
                            - If a section has no significant changes, state "No significant changes"
                            - Skip administrative updates (dates, formatting, minor legal updates)
                            - Give bullet points for each insight
                            - Keep bullet points as concise as possible.

                            Old Filing {section} Section: 
                            {old_text}

                            New Filing {section} Section:
                            {new_text}
                        """
                    }]
                },
            ],
            inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
        )
        raw_text = extract_text_from_bedrock_response(response)
        update_job_status(raw_text, "COMPLETED")
    except Exception as e:
        print(f"Error fetching filings: {str(e)}")
        update_job_status(f"Internal Server Error: {str(e)}", "FAILED")

def compare_10k_filings_worker(event, context):
    return asyncio.run(compare_10k_filings_worker_async(event, context))