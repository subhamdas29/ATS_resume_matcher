"""
keywords.py

Previously called Groq (LLaMA 3.3 70B) for keyword extraction.
Now delegates to ml/extractor.py (Entity Ruler + custom NER).

The dict shape returned by both get_keywords() and get_jd_keywords() is
identical to what this file returned before, so ATS_score.py, suggestions.py,
and main.py are completely unaffected.
"""

from ml.extractor import extract_keywords


def get_keywords(resume_text: str) -> dict:
    """
    Extract structured keywords from a resume.

    Returns:
        {
            "hard_skills":    [...],
            "soft_skills":    [...],
            "job_titles":     [...],
            "education":      [...],
            "certifications": [...],
            "organizations":  [...],
            "experience":     [...],
        }
    """
    return extract_keywords(resume_text)


def get_jd_keywords(jd_text: str) -> dict:
    """
    Extract structured keywords from a job description.

    Same shape as get_keywords(). Job titles and experience entries
    extracted here are used for alignment scoring in job_title.py
    and ATS_score.py.
    """
    return extract_keywords(jd_text)




# from groq import AsyncGroq
# import os
# from dotenv import load_dotenv
# import json

# load_dotenv()
# client=AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# async def get_jd_keywords(text):
    
#     prompt=f"""
#     Extract keywords from this text and categorize them based on the given format.
#     Return only JSON file, nothing else. No explanations.

#     text:{text}

#     {{
#         "hard_skills":   ["Python", "Django", "REST API"],
#         "soft_skills":   ["Integrity", "Leadership quality"],
#         "experience":    ["3 years at Google, Paid internship at WIPRO"],
#         "education":     ["B.Tech Computer Science"],
#         "job_titles":    ["Junior Python Developer"],
#         "organizations": ["Google", "TechCorp"]
#     }}
# """
    
#     response = await client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=[{"role": "user", "content": prompt}],
#         response_format={"type": "json_object"},
#         temperature=0.1
#     )

#     content = response.choices[0].message.content

#     if content is None:
#         return None

#     return json.loads(content)



# async def get_keywords(text,job_title):
    
#     prompt=f"""
#     Extract keywords from this text and categorize them based on the given format and exact key names.
#     Return only JSON file, nothing else. No explanations.

#     text:{text}
#     target_job_title: {job_title}

#     {{
#         "job_title":     ["Junior python developer","Cloud engineer"] or [] if not found,
#         "hard_skills":   ["Python", "Django", "REST API"],
#         "soft_skills":   ["Integrity", "Leadership quality"],
#         "experience":    ["3 years at Google, Paid internship at WIPRO"],
#         "education":     ["B.Tech Computer Science"],
#         "job_titles":    ["Junior Python Developer"],
#         "organizations": ["Google", "TechCorp"],
#         "certifications":["AWS Cloud Practitioner"],
#         "achievements":  ["Hackathon winner"]
#     }}
# """
    
#     response = await client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=[{"role": "user", "content": prompt}],
#         response_format={"type": "json_object"},
#         temperature=0.1
#     )

#     content = response.choices[0].message.content

#     if content is None:
#         return None

#     return json.loads(content)

