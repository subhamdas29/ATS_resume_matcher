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






