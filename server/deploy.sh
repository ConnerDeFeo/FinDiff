#!/bin/bash

cd layers/dynamo/python
pip install -r requirements.txt -t .
cd ../../filings/python
pip install -r requirements.txt -t .
cd ../../utils/python
pip install -r requirements.txt -t .

cd ../../../../terraform
terraform apply --auto-approve

cd ../server/layers/dynamo/python
rm -rf bin boto3** botocore** dateutil jmespath** python** s3transfer** six** urllib3**
cd ../../filings/python
rm -rf bin annotated_types** anyio** beautifulsoup4** boto3** botocore** certifi** bs4** dateutil** h11** httpcore** idna** jmespath** pydantic** s3transfer** six** httpx** python** sniffio** soupsieve** typing_inspection** urllib3** typing_extensions**
cd ../../utils/python
rm -rf bin annotated_types** anyio** beautifulsoup4** boto3** botocore** certifi** bs4** dateutil** h11** httpcore** idna** jmespath** pydantic** s3transfer** six** httpx** python** sniffio** soupsieve** typing_inspection** urllib3** typing_extensions** asyncio** charset**
cd ../../..