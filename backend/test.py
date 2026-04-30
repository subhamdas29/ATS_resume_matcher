import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity"
HEADERS = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}

payload = {
    "inputs": {
        "source_sentence": "Looking for Python FastAPI developer with Docker and AWS",
        "sentences": ["Python FastAPI developer with Docker AWS 3 years experience REST APIs PostgreSQL"]
    }
}

res = requests.post(API_URL, headers=HEADERS, json=payload)

# THIS will tell you exactly what's wrong
print("Status Code:", res.status_code)
print("Response:", res.text)