def get_job_title_score(resume_keywords, user_job_title):
    resume_titles = [char.lower() for char in resume_keywords.get("job_title", [])]
    user_title    = user_job_title.lower()

    for title in resume_titles:
        if title in user_title or user_title in title:
            return 100  

    return 0  