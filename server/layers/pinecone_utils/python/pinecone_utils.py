import asyncio
from pinecone import Pinecone
import boto3
import os
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index("findiff-10k-filings")
s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb', region_name='us-east-2')

def chunk_text(text, chunk_size=800, overlap=50):
    """Split text into chunks with overlap"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks

async def generate_embedding(text):
    """Generate embedding using Bedrock Titan"""
    response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({"inputText": text})
    )
    
    result = json.loads(response['body'].read())
    return result['embedding']  # Returns list of 1024 floats

async def embed_chunk(cik, accession, primaryDoc, chunk_text, chunk_index):
    """Embed a single text chunk and upsert to Pinecone"""
    embedding = await generate_embedding(chunk_text)
    metadata = {
        "cik": cik,
        "accession": accession,
        "primaryDoc": primaryDoc,
        "chunk_index": chunk_index,
        "text": chunk_text
    }
    vector_id = f"{cik}_{accession}_{primaryDoc}_{chunk_index}"
    index.upsert(vectors=[(vector_id, embedding, metadata)])

async def embed_document(cik: str, accession: str, primaryDoc: str, raw_text: str):
    """Main function to embed one 10-K document"""
    tasks = []
    sections = chunk_text(raw_text)
    for chunk_index, chunk in enumerate(sections):
        tasks.append(embed_chunk(cik, accession, primaryDoc, chunk, chunk_index))
    await asyncio.gather(*tasks)