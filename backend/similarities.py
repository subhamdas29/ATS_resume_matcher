import requests
import time
import os
from dotenv import load_dotenv
from suggestions import expand_keywords

load_dotenv()

API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity"
HF_HEADERS = {
    "Authorization": f"Bearer {os.getenv('HF_TOKEN')}",
    "Content-Type": "application/json"
}


def get_similarity_score(resume_text, jd_text):
    
    expanded_resume = expand_keywords(resume_text)

    expanded_jd = expand_keywords(jd_text)

    payload = {
        "inputs": {
            "source_sentence": expanded_jd,
            "sentences": [expanded_resume]
        }
    }

    for attempt in range(5):
        res = requests.post(API_URL, headers=HF_HEADERS, json=payload)

        if res.status_code == 200:
            score = res.json()[0]
            return round(float(score) * 100, 2)

        elif res.status_code == 503:
            print(f"Model loading... retrying ({attempt+1}/5)")
            time.sleep(20)

        else:
            print(f"Error {res.status_code}: {res.text}")
            return None

    return None