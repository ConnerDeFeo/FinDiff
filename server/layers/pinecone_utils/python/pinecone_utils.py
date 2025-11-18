import asyncio
from pinecone import Pinecone
import boto3
import os
import json
from functools import partial

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index("findiff-10k-filings")
s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb', region_name='us-east-2')

async def run_sync(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(func, *args, **kwargs)
    )

def chunk_text(text, chunk_size=800, overlap=50):
    """Split text into chunks with overlap"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks

async def generate_embedding(text):
    response = await run_sync(
        bedrock.invoke_model,
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({"inputText": text})
    )
    result = json.loads(response['body'].read())
    return result['embedding']

async def embed_chunk(cik, accession, primaryDoc, chunk_text, chunk_index, metadata={}):
    embedding = await generate_embedding(chunk_text)
    
    metadata = {
        "cik": cik,
        "accession": accession,
        "primaryDoc": primaryDoc,
        "chunk_index": chunk_index,
        "text": chunk_text,
        **metadata
    }
    
    vector_id = f"{cik}_{accession}_{primaryDoc}_{chunk_index}"
    
    await run_sync(
        index.upsert,
        vectors=[(vector_id, embedding, metadata)]
    )

async def embed_text(cik: str, accession: str, primaryDoc: str, raw_text: str, metadata: dict = {}):
    """Main function to embed one 10-K document"""
    tasks = []
    sections = chunk_text(raw_text)
    for chunk_index, chunk in enumerate(sections):
        tasks.append(embed_chunk(cik, accession, primaryDoc, chunk, chunk_index, metadata))
    await asyncio.gather(*tasks)

async def fetch_existing_embeddings(cik, accession, primaryDoc, prompt):
    vector = await generate_embedding(prompt)
    
    query_response = await run_sync(
        index.query,
        vector=vector,
        top_k=10,
        filter={"cik": cik, "accession": accession, "primaryDoc": primaryDoc}
    )
    
    return query_response.matches