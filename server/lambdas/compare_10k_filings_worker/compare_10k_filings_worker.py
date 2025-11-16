from dynamo import update_item
import boto3
import asyncio
from filings import *

# Configuration constants
MAX_SECTION_TOKENS = 100000  # Maximum tokens per section before splitting
OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

async def compare_10k_filings_worker_async(event, context):
    """
    Main async worker function to compare sections between two 10-K filings.
    Updates DynamoDB with progress and results.
    
    Args:
        event: Lambda event containing stock1, stock2, jobId, and section
        context: Lambda context object
    """
    # Helper to update job status in DynamoDB
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

    # Helper to update job progress in DynamoDB
    def update_job_progress(progress):
        update_item(
            'comparison_jobs',
            key={'job_id': job_id},
            update_expression='SET #progress = :progress',
            expression_attribute_names={'#progress': 'progress'},
            expression_attribute_values={':progress': progress}
        )

    try:
        # Extract parameters from event
        stock1 = event['stock1']
        stock2 = event['stock2']
        job_id = event['jobId']
        section = event['section']

        # Extract filing details for first stock
        cik1 = stock1['cik']
        accession1 = stock1['accessionNumber']
        accession1 = accession1.replace('-', '')  # Remove hyphens for URL
        primaryDoc1 = stock1['primaryDocument']

        # Extract filing details for second stock
        cik2 = stock2['cik']
        accession2 = stock2['accessionNumber']
        accession2 = accession2.replace('-', '')  # Remove hyphens for URL
        primaryDoc2 = stock2['primaryDocument']

        # Validate that both filings are for the same company
        if cik1 != cik2:
            update_job_status("The two filings belong to different companies (CIKs do not match).", "FAILED")
            return

        # Fetch and analyze sections from both filings in parallel
        update_job_progress("Fetching and analyzing sections from filings...")
        old_text, new_text = await asyncio.gather(
            get_10k_section_async(cik1, accession1, primaryDoc1, section),
            get_10k_section_async(cik2, accession2, primaryDoc2, section)
        )

        # Validate that sections were extracted successfully
        if not old_text or not new_text:
            update_job_status("Could not extract the requested section from one or both filings.", "FAILED")
            return
        
        # Use Bedrock AI to compare the sections and generate insights
        update_job_progress("Comparing sections and generating insights...")
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
        
        # Extract and save the comparison results
        raw_text = extract_text_from_bedrock_response(response)
        update_job_status(raw_text, "COMPLETED")
        
    except Exception as e:
        # Handle any errors and update job status
        print(f"Error fetching filings: {str(e)}")
        update_job_status(f"Internal Server Error: {str(e)}", "FAILED")

def compare_10k_filings_worker(event, context):
    """
    Lambda handler function that wraps the async worker.
    
    Args:
        event: Lambda event object
        context: Lambda context object
    """
    return asyncio.run(compare_10k_filings_worker_async(event, context))