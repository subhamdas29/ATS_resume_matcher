from texts import get_texts
from keywords import get_keywords
from ATS_score import calculate_ats_score



def main():

    

    #PDF to Text extraction
    extracted_text=get_texts()

    # word_count = len(extracted_text.split())
    # print(word_count)


    #Text to Keywords extraction
    resume_keywords = (get_keywords(extracted_text))


    job_description="""
    Job DescriptionRole Overview:
    We are seeking a detail-oriented Junior Backend Engineer to join our engineering team.
    You will be responsible for building scalable server-side applications, managing complex databases, and integrating cloud services to support high-performance features.
    This role is ideal for a candidate who has a strong grasp of Data Structures and Algorithms and experience in architecting RESTful APIs.
    Key Responsibilities:API Development: Architect and maintain robust backends using FastAPI or Node.js to support frontend integrations.
    System Design: Develop and implement asynchronous task scheduling and message queuing systems using Google Cloud Pub/Sub.  
    Database Management: Design and optimize normalized schemas in PostgreSQL or MySQL to ensure data integrity and performance.
    Authentication & Security: Implement secure user authentication workflows using JWT and input validation middleware.  
    Cloud Integration: Deploy and manage serverless services on Cloud Run and monitor system health through automated tracking.  
    Collaborative Engineering: Work closely with cross-functional teams to parse complex data and deliver actionable logic, such as automated scoring or matching algorithms.  
    Qualifications:Currently pursuing or recently completed a B.Tech in Computer Science & Engineering.  
    Proven proficiency in Python, JavaScript, and TypeScript.  
    Strong problem-solving skills with a verified track record in Data Structures and Algorithms.  
    Experience with version control tools like Git and GitHub for collaborative development.  
    A background in competitive sports or strategic games (like football or chess) is a plus, demonstrating teamwork and strategic thinking.
    """

    #Keywords extracted from Job description
    job_desc_keywords=(get_keywords(job_description))


    ats_score=calculate_ats_score(resume_keywords,job_desc_keywords)
    print(ats_score)

  
if __name__ == "__main__":
    main()