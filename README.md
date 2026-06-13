# ResumePilot 

**ResumePilot** is a smart ATS (Applicant Tracking System) score checker that scans your resume and gives a detailed analysis based on your resume, a job description, and a target job role — helping you understand exactly where you stand before applying.

---

## What It Does

- **ATS Score** — a blended score calculated using semantic similarity, keyword matching, section quality, and job title alignment
- **Hard & Soft Skill Analysis** — shows which skills from the job description are present in your resume and which are missing
- **Keyword Expansion** — if your resume mentions *data analyst*, ResumePilot infers related skills like *numpy* and *matplotlib* even if they aren't explicitly listed
- **Weak Section Detection** — flags resume sections (summary, experience, education, etc.) that need improvement
- **Overall Feedback & Suggestions** — actionable recommendations tailored to your resume and the job description
- **GitHub Profile Analysis** — detects GitHub links in your resume, scans your profile for commits, PRs, and recent activity, and factors it into your overall score
- **Word Count Check** — tells you if your resume is too short, too long, or within the ideal 400–800 word range

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI |
| PDF Parsing | PyPDF2 |
| Keyword Extraction & Analysis | Groq API (LLaMA 3.3 70B) |
| Semantic Similarity | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| GitHub Analysis | GitHub REST API |
| Frontend | HTML, CSS, JavaScript |
| Backend Deployment | Railway |
| Frontend Deployment | Vercel |

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
│   ├── ATS_score.py        # Final score calculation
│   ├── github_score.py     # GitHub profile analysis
│   ├── job_title.py        # Job title match scoring
│   ├── keywords.py         # Groq-powered keyword extraction
│   ├── main.py             # FastAPI app and /analyze endpoint
│   ├── requirements.txt
│   ├── similarities.py     # HuggingFace semantic similarity
│   ├── suggestions.py      # Keyword expansion + resume analysis
│   └── texts.py            # PDF text extraction + link detection
├── frontend/
│   ├── index.html          # Single-page UI
│   ├── script.js           # API calls and result rendering
│   └── styles.css          # Styling
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
```

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

### Frontend

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

---

## Contributors

- **Subham Das**
- **Rivo Khara**
- **Sushobhan Biswas**
- **Arghyodeep Samanta**
- **Sovan Lal Ganguly**

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key |
| `HF_TOKEN` | HuggingFace API token |
| `GITHUB_TOKEN` | GitHub Personal Access Token (PAT) |