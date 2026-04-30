from groq import Groq
import os
from dotenv import load_dotenv


load_dotenv()
client=Groq(api_key=os.getenv("GROQ_API_KEY"))

def expand_keywords(text):
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
    response=client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    content = response.choices[0].message.content

    if content is None:
        return text 

    return content.strip()



def resume_analyzer(resume_text,jd_text):
    prompt=f"""
    You are an expert ATS (Applicant Tracking System) analyzer.
    
    Analyze the resume against the job description and return ONLY a JSON object.
    
    Resume:
    {resume_text}
    
    Job Description:
    {jd_text}
    
    Return this exact JSON structure:
    {{
        "missing_keywords": ["keyword1", "keyword2"],
        "matched_keywords": ["keyword1", "keyword2"],
        "section_scores": {{
            "skills": 85,
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
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}  
    )
    return response.choices[0].message.content