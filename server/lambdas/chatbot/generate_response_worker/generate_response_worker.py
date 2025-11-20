import json
from dynamo import update_item
from filings import extract_text_from_bedrock_response, get_10k_section_async, section_order
import boto3
import asyncio

OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def call_bedrock_model(prompt: str, temp:float = 0.0) -> str:
    response = bedrock.converse(
        modelId = "openai.gpt-oss-120b-1:0",
        messages=[
            {
                "role": "user", 
                "content": [{"text": prompt}]
            },
        ],
        inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": temp}
    )
    return extract_text_from_bedrock_response(response)

def get_relevant_sections(prompt: str) -> dict:
    available_sections = [section[0] for section in section_order]
    response = call_bedrock_model(
        f"""
            You are an expert financial analyst. Based on the user prompt below,
            identify up to three sections needed from a 10-K filing to best answer the prompt.
            
            User Prompt:
            {prompt}
            return your answer as a json object in the form:
            {{
                "sections": [list of sections from the following available sections: {', '.join(available_sections)}]
            }}
        """)
    try:
        res = json.loads(response)
    except json.JSONDecodeError:
        res = {"sections": []}
    return res

async def generate_response_worker_async(event, context):
    
    def update_job_status(result, status):
        update_item(
            'conversation_jobs',
            key={'job_id': job_id},
            update_expression='SET #status = :status, #result = :result',
            expression_attribute_names={'#status': 'status', "#result": "result"},
            expression_attribute_values={
                ':status': status,
                ':result': result
            }
        )

    try:
        cik = event["cik"]
        accession = event["accession"]
        primaryDoc = event["primaryDoc"]
        prompt = event["prompt"]
        job_id = event["job_id"]

        # Parse user prompt to identify requested sections
        sections = get_relevant_sections(prompt).get("sections", [])
        summaires = [
            get_10k_section_async(cik, accession.replace("-", ""), primaryDoc, section) 
            for section in sections
        ]
        section_texts = await asyncio.gather(*summaires)

        response = call_bedrock_model(
            f"""
                You are an expert financial analyst. Using the following extracted sections from a 10-K filing,
                provide a detailed response to the user's prompt below.

                User Prompt:
                {prompt}

                Extracted Sections:
                {"\n".join([f"Section: {sections[i]}\nContent: {section_texts[i]}" for i in range(len(sections))])}

                Provide your answer in a clear and concise manner.
                Provide your answer in markdown format.
            """,
            temp = 0.8
        )

        update_job_status(response, "COMPLETED")
    except Exception as e:
        print(f"Error in generate_response_worker: {e}")
        update_job_status("FAILED", "FAILED")

def generate_response_worker(event, context):
    return asyncio.run(generate_response_worker_async(event, context))