from groq import AsyncGroq
import os
from dotenv import load_dotenv
import json

load_dotenv()
client=AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

async def expand_keywords(text):
    prompt=f"""
    You are a tech skill mapper.
    
    Expand each technology/skill to include its parent language or ecosystem.
    
    Example:
    Input:  "numpy pandas django"
    Output: "numpy pandas django python data-science web-framework"
    
    Input:  "react redux express"
    Output: "react redux express javascript frontend backend nodejs"
    
    Rules:
    - Only return the expanded text, nothing else
    - No explanations, no bullet points
    - Keep original words AND add parent technologies
    
    Text to expand: {text}
    """
    response=await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    content = response.choices[0].message.content

    if content is None:
        return text 

    return content.strip()



async def resume_analyzer(resume_text,jd_text):
    prompt=f"""
    You are an expert ATS (Applicant Tracking System) analyzer.
    Analyze the resume against the job description and return ONLY a JSON object.
    
    Resume:
    {resume_text}
    
    Job Description:
    {jd_text}
    
    Return this exact JSON structure with exact key name:
    {{
        "hard_skill_missing_keywords": ["python", "c++"],
        "hard_skill_matched_keywords": ["aws", "mysql"],
        "soft_skill_missing_keywords": ["strategic problem solving", "collaborative communication"],
        "soft_skill_matched_keywords": ["integrity", "leadership quality"],
        "section_scores": {{
            "hard-skills": 85,
            "soft-skills": 40,
            "experience": 70,
            "education": 90,
            "summary": 60
        }},
        "weak_sections": ["summary", "experience"],
        "suggestions": [
            "Add Python to your skills section",
            "Quantify your achievements with numbers"
        ],
        "overall_feedback": "Your resume lacks key technical skills..."
    }}

    Note: If experience required is not mentioned in the job description or it is mentioned that 
    experience required is '0-1' years: give max score to experience even if experience is not specified in the resume. 
"""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",  
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}  
    )
    content= response.choices[0].message.content
    if content is None:
        return None 

    return json.loads(content.strip())