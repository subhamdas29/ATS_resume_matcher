from groq import AsyncGroq
import os
from dotenv import load_dotenv
import json

load_dotenv()
client=AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

async def get_jd_keywords(text):
    
    prompt=f"""
    Extract keywords from this text and categorize them based on the given format.
    Return only JSON file, nothing else. No explanations.

    text:{text}

    {{
        "hard_skills":   ["Python", "Django", "REST API"],
        "soft_skills":   ["Integrity", "Leadership quality"],
        "experience":    ["3 years at Google, Paid internship at WIPRO"],
        "education":     ["B.Tech Computer Science"],
        "job_titles":    ["Junior Python Developer"],
        "organizations": ["Google", "TechCorp"]
    }}
"""
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1
    )

    content = response.choices[0].message.content

    if content is None:
        return None

    return json.loads(content)



async def get_keywords(text,job_title):
    
    prompt=f"""
    Extract keywords from this text and categorize them based on the given format and exact key names.
    Return only JSON file, nothing else. No explanations.

    text:{text}
    target_job_title: {job_title}

    {{
        "job_title":     ["Junior python developer","Cloud engineer"] or [] if not found,
        "hard_skills":   ["Python", "Django", "REST API"],
        "soft_skills":   ["Integrity", "Leadership quality"],
        "experience":    ["3 years at Google, Paid internship at WIPRO"],
        "education":     ["B.Tech Computer Science"],
        "job_titles":    ["Junior Python Developer"],
        "organizations": ["Google", "TechCorp"],
        "certifications":["AWS Cloud Practitioner"],
        "achievements":  ["Hackathon winner"]
    }}
"""
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1
    )

    content = response.choices[0].message.content

    if content is None:
        return None

    return json.loads(content)

