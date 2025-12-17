#!/bin/bash

cd layers/utils/python
pip install -r requirements.txt -t .
cd ../../filings/python
pip install -r requirements.txt -t .
cd ../../user_auth/python
pip install -r requirements.txt -t .

cd ../../../../terraform
terraform apply --auto-approve

cd ../server/layers/utils/python
rm -rf bin certifi** charset** idna** urllib3** requests** stripe** typing_extensions**
cd ../../filings/python
rm -rf bin annotated_types** anyio** beautifulsoup4** boto3** botocore** certifi** bs4** dateutil** h11** httpcore** idna** jmespath** pydantic** s3transfer** six** httpx** python** sniffio** soupsieve** typing_inspection** urllib3** typing_extensions**
cd ../../user_auth/python
rm -rf bin certifi** charset** idna** urllib3** requests** typing_extensions** ecdsa** jose** pyasn1** rsa** six** cffi** _cffi** cryptography** pycparser** python_jose**
cd ../../..