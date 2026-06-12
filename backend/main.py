from texts import get_texts
import asyncio
import aiofiles
from job_title import get_job_title_score
from keywords import get_keywords, get_jd_keywords
from ATS_score import calculate_ats_score
from fastapi import FastAPI, UploadFile, File, Form
import os
from fastapi.middleware.cors import CORSMiddleware
import shutil
from links import get_links

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {"message": "The app is running"}

@app.post("/analyze")
async def resume_analyzer(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(...)
):
    temp_path=f"media/{resume.filename}"
    async with aiofiles.open(temp_path, "wb") as buffer:
        content = await resume.read()
        await buffer.write(content)

    # PDF to text
    extracted_text= await asyncio.to_thread(get_texts, temp_path)

    # detect any links in resume
    detected_links= await asyncio.to_thread(get_links, temp_path, extracted_text)

    # remove the resume from the storage because the content is already extracted, we don't need it anymore
    os.remove(temp_path)

    if not extracted_text:
        return{"Error": "Could not extract text from PDF. Try another file."}



    word_count=len(extracted_text.split())

    if word_count>=400 and word_count<=800:
        wc_msg= "Word count is within the recommended range of 400–800 words — ideal for a professional resume."
    elif word_count<400:
        wc_msg= "Your resume is too brief. Add more detail to reach the recommended 400–800 word range."
    else:
        wc_msg= "Your resume exceeds the recommended limit. Trim it down to 800 words or fewer for maximum impact."



    resume_keywords, jd_keywords = await asyncio.gather(
        get_keywords(extracted_text,job_title),
        get_jd_keywords(job_description))


    if resume_keywords is None or jd_keywords is None:
        return{"Error": "Keyword extraction failed. Try again later."}
    


    job_title_score = get_job_title_score(resume_keywords, job_title)

    if job_title_score==100:
        jt_msg=f"Your resume aligns with the target role of {job_title}."
    else:
        jt_msg=f"Your resume does not appear to target the {job_title} role. Consider tailoring your resume for this position."




    ats_score=await calculate_ats_score(resume_keywords,jd_keywords, job_title_score, detected_links)

    if not ats_score:
        return {"Error": "Could not generate ATS score. Try again later."}

    return {"word_count":wc_msg, "job_title_match": jt_msg, **ats_score}