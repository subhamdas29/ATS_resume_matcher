from keywords import get_keywords
from texts import get_texts

def main():
    
    #PDF to Text extraction
    extracted_text=get_texts()

    #Text to Keywords extraction
    resume_keywords = set(get_keywords(extracted_text))

    #Keywords extracted from Job description
    job_description=set(get_keywords("""
    We are looking for a Python Junior Developer experienced with FastAPI, 
    PostgreSQL, and NLTK for natural language processing tasks. 
    Knowledge of Docker and AWS is a plus.
    """))

    matched_skills = job_description.intersection(resume_keywords)
    missing_skills = job_description - resume_keywords
    match_percentage = (len(matched_skills) / len(job_description)) * 100

    print(f"Match Score: {match_percentage:.2f}%")
    print(f"Matched: {matched_skills}")
    print(f"Missing: {missing_skills}")




    # print("--- Extracted Keywords ---")
    # print(resume_keywords)
    # print("---Extracted Text---")
    # print(extracted_text)    
if __name__ == "__main__":
    main()