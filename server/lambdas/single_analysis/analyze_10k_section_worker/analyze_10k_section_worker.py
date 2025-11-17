from dynamo import update_item
import boto3
from filings import *
import asyncio

# Configuration constants
MAX_SECTION_TOKENS = 100000  # Maximum tokens per section before splitting
OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

async def analyze_10k_section_worker_async(event, context):
    # Helper to update job status in DynamoDB
    def update_job_status(result, status):
        update_item(
            'single_section_analysis_jobs',
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
            'single_section_analysis_jobs',
            key={'job_id': job_id},
            update_expression='SET #progress = :progress',
            expression_attribute_names={'#progress': 'progress'},
            expression_attribute_values={':progress': progress}
        )

    try:
        # Extract parameters from event
        stock = event['stock']
        job_id = event['jobId']
        section = event['section']

        # Extract filing details for first stock
        cik1 = stock['cik']
        accession1 = stock['accessionNumber']
        accession1 = accession1.replace('-', '')  # Remove hyphens for URL
        primaryDoc1 = stock['primaryDocument']

        # Fetch and analyze sections from both filings in parallel
        update_job_progress("Fetching and analyzing sections from filing...")
        text = await get_10k_section_async(cik1, accession1, primaryDoc1, section)
        

        # Validate that sections were extracted successfully
        if not text:
            update_job_status("Could not extract the requested section from the filing.", "FAILED")
            return
        
        # Use Bedrock AI to compare the sections and generate insights
        update_job_progress("Analyzing section and generating insights...")
        response = bedrock.converse(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            You are a value investor analyzing a 10-K section.
                            Your goal is to return a marked-down formatted summary of key insights from the filing.

                            RULES:
                            - Separate insights by section, with a heading (h2) for each section
                            - Give bullet points for each insight
                            - Keep bullet points as concise as possible.

                            Filing {section} Text:
                            {text}
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

def analyze_10k_section_worker(event, context):
    return asyncio.run(analyze_10k_section_worker_async(event, context))
