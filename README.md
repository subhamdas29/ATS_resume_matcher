# ResumePilot 

**ResumePilot** is a smart ATS (Applicant Tracking System) score checker that scans your resume and gives a detailed analysis based on your resume, a job description, and a target job role — helping you understand exactly where you stand before applying.

---

## What It Does

* **ATS Score** — a blended score calculated using semantic similarity, keyword matching, section quality, and job title alignment
* **Hard & Soft Skill Analysis** — shows which skills from the job description are present in your resume and which are missing
* **Keyword Expansion** — if your resume mentions data analyst, ResumePilot infers related skills like numpy and matplotlib even if they aren't explicitly listed
* **Weak Section Detection** — flags resume sections (summary, experience, education, etc.) that need improvement
* **Overall Feedback & Suggestions** — actionable recommendations tailored to your resume and the job description
* **GitHub Profile Analysis** — detects GitHub links in your resume, scans your profile for commits, PRs, and recent activity, and factors it into your overall score
* **Word Count Check** — tells you if your resume is too short, too long, or within the ideal 400–800 word range
* **NLP-Powered Keyword Extraction** — uses a custom spaCy Entity Ruler with 379 patterns across hard skills, soft skills, job titles, education, and certifications, layered with a custom-trained NER model, replacing the previous Groq-only extraction with a local ML pipeline
* **User Accounts & Score History** — create an account, log in, and every analysis is saved to your personal history — revisit any past scorecard at any time from the My History page
* **Job Suggestions** — after every analysis, ResumePilot queries the Adzuna Jobs API and surfaces relevant open positions matched to your skills and target job title, with salary info, location, and a direct apply link

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI |
| PDF Parsing | PyPDF2 |
| Keyword Extraction (NLP) | spaCy — custom Entity Ruler (379 patterns) + trained NER model |
| LLM Analysis & Feedback | Groq API (LLaMA 3.3 70B) |
| Semantic Similarity | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| GitHub Analysis | GitHub REST API |
| Job Suggestions | Adzuna Jobs API |
| Authentication | Supabase Auth (JWT-based) |
| Database | Supabase (PostgreSQL) — score history per user |
| Frontend | React (Vite) |
| Frontend Deployment | Vercel |
| Backend Deployment | Local / HuggingFace Spaces |

---

## How the ATS Score Is Calculated

The final score is a weighted blend of six signals:

```
ATS Score =
  Section Score Average  × 0.28
  Hard Skill Match       × 0.35
  Semantic Similarity    × 0.15
  Soft Skill Match       × 0.07
  Job Title Match        × 0.05
  GitHub Score           × 0.10
```

---

## Project Structure

```
ATS_RESUME_MATCHER/
├── backend/
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── extractor.py              # Unified NLP entry point (Entity Ruler + NER)
│   │   ├── entity_ruler/
│   │   │   └── skills.jsonl          # 379 skill/title/education patterns
│   │   ├── ner_model/                # Trained spaCy NER model (local only, not in git)
│   │   └── training/
│   │       ├── config.cfg            # spaCy training config
│   │       ├── convert.py            # Raw dataset → .spacy binary format
│   │       ├── train.py              # Model training pipeline
│   │       ├── evaluate.py           # Per-label F1 evaluation
│   │       └── data/
│   │           ├── raw/              # Kaggle annotated resume dataset
│   │           ├── train.spacy       # Generated training data
│   │           └── dev.spacy         # Generated dev/eval data
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py               # Supabase client (service role)
│   │   └── crud.py                   # save_analysis, get_user_analyses, get_single_analysis
│   ├── ATS_score.py                  # Final weighted score computation
│   ├── auth.py                       # JWT verification (Supabase)
│   ├── github_score.py               # GitHub profile analysis
│   ├── job_search.py                 # Adzuna Jobs API integration
│   ├── job_title.py                  # Job title match scoring
│   ├── keywords.py                   # spaCy-based keyword extraction (replaces Groq)
│   ├── main.py                       # FastAPI app — /analyze, /jobs, /history endpoints
│   ├── requirements.txt
│   ├── similarities.py               # HuggingFace semantic similarity
│   ├── suggestions.py                # Keyword expansion + resume analysis (Groq)
│   ├── texts.py                      # PDF text extraction + GitHub link detection
│   └── Dockerfile                    # HuggingFace Spaces deployment
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabaseClient.js     # Shared Supabase client instance
│   │   └── App.jsx                   # React SPA — all pages and components
│   ├── .env                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```
GROQ_API_KEY=your_groq_key
HF_TOKEN=your_huggingface_token
GITHUB_TOKEN=your_github_pat
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_COUNTRY=in
```

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

### Frontend

Create a `.env` file inside `frontend/`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

Open `frontend/index.html` directly in a browser. It calls `http://localhost:8000` by default.

---

## API Reference

### `POST /analyze`

| Field | Type | Description |
|---|---|---|
| `resume` | File (PDF) | Your resume |
| `job_description` | string | The full job description |
| `job_title` | string | Target job title |

**Response:**

```json
{
  "ats_score": 74.3,
  "word_count": "Word count is within the recommended range...",
  "job_title_match": "Your resume aligns with the target role...",
  "hard_skills_match": ["Python", "FastAPI", "PostgreSQL"],
  "hard_skills_missing": ["Docker", "Redis"],
  "soft_skills_match": ["Leadership"],
  "soft_skills_missing": ["Communication"],
  "weak_sections": ["summary"],
  "suggestions": ["Add Docker to your skills section", "Quantify achievements"],
  "feedback": "Your resume is a strong match overall...",
  "github": "Your GitHub profile looks perfect! Your active contributions and strong project history highly complement your application."
}
```

### `POST /jobs`
Requires Authorization: Bearer <token> header.

**Response:**

```json
{
  "query_title": "Backend Developer",
  "jobs": [
    {
      "id": "adzuna_job_id",
      "title": "Python Backend Developer",
      "company": "TechCorp",
      "location": "Bangalore, India",
      "salary_min": 800000,
      "salary_max": 1200000,
      "description": "We are looking for a Python developer...",
      "url": "https://www.adzuna.in/details/...",
      "created": "2026-07-10T08:00:00Z",
      "category": "IT Jobs"
    }
  ]
}
```

### `GET /history`
Requires Authorization: Bearer <token> header. Returns all past scorecards for the authenticated user, newest first.

```json
{
  "analyses": [
    {
      "id": "uuid",
      "created_at": "2026-07-11T10:00:00Z",
      "job_title": "Backend Developer",
      "ats_score": 74,
      "word_count_feedback": "...",
      "github_status": "...",
      "overall_feedback": "...",
      "suggestions": ["..."],
      "matched_hard_skills": ["Python", "FastAPI"],
      "missing_hard_skills": ["Docker"],
      "matched_soft_skills": ["Leadership"],
      "missing_soft_skills": ["Communication"],
      "section_scores": {
        "hard_skills": { "score": 80, "feedback": "..." },
        "experience": { "score": 65, "feedback": "..." }
      }
    }
  ]
}
```

GET /history/{analysis_id}
Requires Authorization: Bearer <token> header. Returns one specific scorecard belonging to the authenticated user.
Response: Same shape as a single item from /history, returns 404 if not found or not owned by the requesting user.
---

## Contributors

- **Subham Das**
- **Rivo Khara**
- **Sushobhan Biswas**
- **Arghyodeep Samanta**
- **Sovan Lal Ganguly**

---
