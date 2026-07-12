import os
import re
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
ADZUNA_COUNTRY = os.getenv("ADZUNA_COUNTRY", "in").strip().lower() or "in"


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        value = " ".join(str(item) for item in value)
    value = str(value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()



def _extract_role_from_sentence(text: str) -> str:
    text = _clean_text(text)
    patterns = [
        r"target role of\s+([^\.]+)",
        r"role of\s+([^\.]+)",
        r"for\s+(?:the\s+)?(?:target\s+)?role\s+of\s+([^\.]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _clean_text(match.group(1))
    return text
def _pick_query(job_title: str = "", matched_hard_skills: list[str] | None = None) -> str:
    title = _extract_role_from_sentence(job_title)
    skills = [_clean_text(skill) for skill in (matched_hard_skills or []) if _clean_text(skill)]

    # Adzuna performs better with a compact query. Keep the title first and add
    # only a few skills.
    parts = []
    if title:
      parts.append(title)
    parts.extend(skills[:4])

    query = " ".join(parts).strip()
    return query or "software developer"


def _request_adzuna(url: str, params: dict) -> list[dict]:
    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    payload = response.json()

    jobs = []
    for item in payload.get("results", []):
        company = item.get("company") or {}
        location = item.get("location") or {}
        category = item.get("category") or {}
        jobs.append({
            "id": item.get("id"),
            "title": item.get("title"),
            "company": company.get("display_name"),
            "location": location.get("display_name"),
            "category": category.get("label"),
            "description": item.get("description"),
            "url": item.get("redirect_url"),
            "created": item.get("created"),
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
        })
    return jobs


async def search_jobs(
    job_title: str = "",
    matched_hard_skills: list[str] | None = None,
    results_per_page: int = 8,
    country: str | None = None,
) -> list[dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        raise RuntimeError("Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in backend .env")

    selected_country = (country or ADZUNA_COUNTRY or "in").strip().lower()
    url = f"https://api.adzuna.com/v1/api/jobs/{selected_country}/search/1"
    query = _pick_query(job_title, matched_hard_skills)

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": max(1, min(int(results_per_page or 8), 20)),
        "what": query,
        "content-type": "application/json",
    }

    print(f"[jobs] searching Adzuna country={selected_country} query={query!r}")
    jobs = _request_adzuna(url, params)

    if not jobs and job_title:
        relaxed_query = _extract_role_from_sentence(job_title)
        if relaxed_query and relaxed_query != query:
            params["what"] = relaxed_query
            print(f"[jobs] retrying Adzuna with relaxed query={relaxed_query!r}")
            jobs = _request_adzuna(url, params)

    return jobs


