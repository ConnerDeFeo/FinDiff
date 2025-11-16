#!/bin/bash

cd layers/utils/python
pip install -r requirements.txt -t .
cd ../../filings/python
pip install -r requirements.txt -t .

cd ../../../../terraform
terraform apply --auto-approve

cd ../server/layers/utils
rm -rf bin certifi** charset** idna** urllib3** requests**
cd ../../filings/python
rm -rf bin annotated_types** anyio** beautifulsoup4** boto3** botocore** certifi** bs4** dateutil** h11** httpcore** idna** jmespath** pydantic** s3transfer** six** httpx** python** sniffio** soupsieve** typing_inspection** urllib3** typing_extensions**
cd ../../..