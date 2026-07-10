"""
main.py — ADDITIONS ONLY
========================
This file shows ONLY what to add to your existing main.py.
Do not replace your existing file — integrate these changes into it.

SECTION 1: Add these imports at the top alongside your existing ones
SECTION 2: Update the /analyze endpoint signature
SECTION 3: Add two new endpoints after /analyze
"""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 1 — ADD THESE IMPORTS at the top of your existing main.py
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from fastapi import Depends
from auth import get_current_user
from db.crud import save_analysis, get_user_analyses, get_single_analysis


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 2 — UPDATE YOUR EXISTING /analyze ENDPOINT
#
# Your current signature probably looks like:
#
#   @app.post("/analyze")
#   async def analyze_resume(
#       resume: UploadFile = File(...),
#       job_description: str = Form(...),
#       job_title: str = Form(...),
#   ):
#
# Change it to add `user_id: str = Depends(get_current_user)`:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(...),
    user_id: str = Depends(get_current_user),   # ← ADD THIS LINE
):
    # ... your existing pipeline code stays exactly as-is ...

    # ADD these two lines right before your final `return result`:
    save_analysis(result, job_title, user_id)
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 3 — ADD THESE TWO NEW ENDPOINTS after your /analyze endpoint
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/history")
async def get_history(user_id: str = Depends(get_current_user)):
    """
    Returns all past scorecards for the authenticated user, newest first.
    Frontend calls this to render the history/dashboard page.
    """
    analyses = get_user_analyses(user_id)
    return {"analyses": analyses}


@app.get("/history/{analysis_id}")
async def get_scorecard(
    analysis_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Returns one specific scorecard.
    Frontend calls this when the user clicks on a past result.
    """
    scorecard = get_single_analysis(analysis_id, user_id)
    if not scorecard:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return scorecard