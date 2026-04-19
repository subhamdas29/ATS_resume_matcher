from keywords import get_keywords
from texts import get_texts, split_into_sections
from sentence_transformers import SentenceTransformer, util

def main():

    model = SentenceTransformer('all-MiniLM-L6-v2')

    #PDF to Text extraction
    extracted_text=get_texts()

    #Extracted texts filled into different sections
    extracted_sections=split_into_sections(extracted_text)


    #Text to Keywords extraction
    resume_keywords = set(get_keywords(extracted_text))

    job_description="""
    We are looking for a Python Junior Developer experienced with FastAPI, 
    restAPI, SQL, React, Javascript and habituated with AWS
    """

    #Keywords extracted from Job description
    job_desc_keywords=set(get_keywords(job_description))

    matched_skills = job_desc_keywords.intersection(resume_keywords)
    missing_skills = job_desc_keywords - resume_keywords
    #match_percentage = (len(matched_skills) / len(job_desc_keywords)) * 100

    # print(f"Match Score: {match_percentage:.2f}%")
    print(f"Matched: {matched_skills}")
    print(f"Missing: {missing_skills}")



    # 1. Encode all three high-value sections
    skills_vec = model.encode(extracted_sections.get('SKILLS', ""))

    e_text = extracted_sections.get('EXPERIENCE', "").strip()

    proj_vec = model.encode(extracted_sections.get('PROJECTS', ""))


    jd_vec = model.encode(job_description)
    
    w_skills = 0.5  # 50%
    w_projects = 0.3 # 30%
    w_experience = 0.2 # 20%

    if not e_text:
        
        w_skills = 0.6    # Increase Skills importance
        w_projects = 0.4  # Increase Projects importance
        w_experience = 0.0 # Ignore Experience
        exp_sim = 0.0
    else:
        exp_vec = model.encode(e_text)
        exp_sim = util.cos_sim(exp_vec, jd_vec).item()

# 3. Calculate individual similarities
    skills_sim = util.cos_sim(skills_vec, jd_vec).item()
    proj_sim = util.cos_sim(proj_vec, jd_vec).item()


# 5. Calculate Final Weighted Score
    score = (skills_sim * w_skills) + (proj_sim * w_projects) + (exp_sim * w_experience)

    print(f"AI Match Score: {score * 100:.2f}%")




    # print("--- Extracted Keywords ---")
    # print(resume_keywords)
    # print("---Extracted Text---")
    # print(extracted_text)    
if __name__ == "__main__":
    main()