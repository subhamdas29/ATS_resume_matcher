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






