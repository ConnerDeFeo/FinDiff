from pinecone_utils import embed_text, fetch_existing_embeddings
from dynamo import update_item
from filings import parse_text_from_html, fetch_10k_from_sec, extract_text_from_bedrock_response, get_requested_section, section_order
import boto3
import asyncio

OUTPUT_TOKENS = 8000  # Maximum output tokens for Bedrock responses
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

async def generate_response_worker(event, context):

    def update_job_progress(progress):
        update_item(
            'conversation_jobs',
            key={'job_id': job_id},
            update_expression='SET #progress = :progress',
            expression_attribute_names={'#progress': 'progress'},
            expression_attribute_values={':progress': progress}
        )

    try:
        cik = event["cik"]
        accession = event["accession"]
        primaryDoc = event["primaryDoc"]
        prompt = event["prompt"]
        job_id = event["job_id"]

        doc = fetch_10k_from_sec(f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession.replace('-', '')}/{primaryDoc}")
        text = parse_text_from_html(doc)
        sections = {}
        for section, _ in section_order:
            section_text, _  = get_requested_section(text, section)
            if section_text:
                sections[section] = section_text

        section_embedding_tasks = []
        for seciton in sections.keys():
            section_embedding_tasks.append(
                embed_text(cik, accession, primaryDoc, sections[seciton], metadata={"section": seciton})
            )
        await asyncio.gather(*section_embedding_tasks)

        matches = await fetch_existing_embeddings(cik, accession, primaryDoc, prompt)
        matches_data = [match['metadata']['text'] for match in matches]

        response = bedrock.converse(
            modelId = "openai.gpt-oss-120b-1:0",
            messages=[
                {
                    "role": "user", 
                    "content": [{"text": 
                        f"""
                            You are a value investing assistant. The user has typed the following prompt: "{prompt}".
                            The following is the relevant information extracted from the company's latest 10-K filing:
                            {" ".join(matches_data)}
                        """
                    }]
                },
            ],
            inferenceConfig={"maxTokens": OUTPUT_TOKENS, "temperature": 0}
        )
        response_text = extract_text_from_bedrock_response(response)

        update_job_progress(response_text)
    except Exception as e:
        print(f"Error in generate_response_worker: {e}")
        update_job_progress("FAILED")