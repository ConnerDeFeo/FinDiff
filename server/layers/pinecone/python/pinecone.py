from pinecone import Pinecone
import boto3
import os
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index("findiff-10k-filings")
s3 = boto3.client('s3')

def chunk_text(text, chunk_size=800, overlap=100):
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

def extract_year_from_accession(accession):
    # Accession format: 0000320193-23-000077
    # Year is in positions after first hyphen
    parts = accession.split('-')
    if len(parts) >= 2:
        year_2digit = int(parts[1])
        # Convert 2-digit year to 4-digit
        # Assuming 00-49 = 2000-2049, 50-99 = 1950-1999
        if year_2digit >= 50:
            return 1900 + year_2digit
        else:
            return 2000 + year_2digit
    return None

def embed_document(cik: str, accession: str, primaryDoc: str, sections:list):
    """Main function to embed one 10-K document"""
    
    