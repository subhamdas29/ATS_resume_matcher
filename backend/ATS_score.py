from suggestions import resume_analyzer,expand_keywords
from similarities import get_similarity_score
import asyncio
from github_score import get_github_score


async def calculate_ats_score(resume_text, jd_text,job_title_score: int, link):

    # expand both texts (domain aware)
    expanded_resume, expanded_jd = await asyncio.gather(
        expand_keywords(resume_text),
        expand_keywords(jd_text)
    )

    # semantic similarity on expanded text
    similarity_score = await get_similarity_score(expanded_resume, expanded_jd)
    
    # get a github score based on the user github profile
    if link:
        git_score, gh_msg = await get_github_score(link)
    else:
        git_score, gh_msg = 0, "No GitHub link provided(Adding a GitHub profile link will highly improve your ATS score)."

    # full analysis
    analysis = await resume_analyzer(resume_text, jd_text)

    if analysis is None:
        return None
    else:
        hard_skill_matched_keywords = analysis.get("hard_skill_matched_keywords", [])
        hard_skill_missing_keywords = analysis.get("hard_skill_missing_keywords", [])
        soft_skill_matched_keywords = analysis.get("soft_skill_matched_keywords", [])
        soft_skill_missing_keywords = analysis.get("soft_skill_missing_keywords", [])
        section_scores              = analysis.get("section_scores", {})

    

    # average all section scores into one number
    section_score_avg = sum(section_scores.values()) / len(section_scores)

    hard_skill=len(hard_skill_matched_keywords) + len(hard_skill_missing_keywords)
    soft_skill=len(soft_skill_matched_keywords) + len(soft_skill_missing_keywords)

    # keyword match percentage
    hard_skill_keyword_score = (len(hard_skill_matched_keywords) / max(hard_skill, 1)) * 100
    soft_skill_keyword_score = (len(soft_skill_matched_keywords) / max(soft_skill, 1)) * 100
    # Step 4 — final blended score

    if similarity_score is not None and analysis is not None:
        final_score = (
    section_score_avg           *0.28 +
    similarity_score            *0.15 +
    hard_skill_keyword_score    *0.35 +
    soft_skill_keyword_score    *0.07 +
    job_title_score             *0.05 +
    git_score                   *0.10
)
        return {
        "ats_score": round(final_score, 1),
        "hard_skills_match": analysis.get("hard_skill_matched_keywords", []),
        "hard_skills_missing": analysis.get("hard_skill_missing_keywords", []),
        "soft_skills_match": analysis.get("soft_skill_matched_keywords", []),
        "soft_skills_missing": analysis.get("soft_skill_missing_keywords", []),
        "weak_sections": analysis.get("weak_sections", []),
        "suggestions": analysis.get("suggestions", []),
        "feedback": analysis.get("overall_feedback", []),
        "github": gh_msg
    }

    else:
        return None