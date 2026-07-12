"""
db/crud.py

Database operations for ResumePilot history.
"""

from db.database import supabase_client


def _as_list(value):
    if isinstance(value, list):
        return value
    if not value:
        return []
    return [value]


def _safe_child_insert(table_name: str, rows: list[dict]) -> None:
    if not rows:
        return
    try:
        supabase_client.table(table_name).insert(rows).execute()
    except Exception as exc:
        print(f"[db] child insert failed for {table_name}: {exc}")


def save_analysis(result: dict, job_title: str, user_id: str) -> str | None:
    """
    Persist an analysis linked to the authenticated user.
    The main analyses row is the source of the History list, so child-table
    failures are logged but do not hide the saved scorecard.
    """
    try:
        analysis_row = {
            "user_id": user_id,
            "job_title": job_title,
            "ats_score": round(result.get("ats_score") or 0),
            "word_count_feedback": result.get("word_count_feedback"),
            "github_status": result.get("github_status"),
            "overall_feedback": result.get("feedback") or result.get("overall_feedback"),
            "suggestions": _as_list(result.get("suggestions")),
        }

        analysis_resp = supabase_client.table("analyses").insert(analysis_row).execute()
        if not analysis_resp.data:
            print(f"[db] save_analysis returned no inserted row: {analysis_resp}")
            return None

        analysis_id = analysis_resp.data[0].get("id")
        if not analysis_id:
            print(f"[db] inserted analysis row has no id: {analysis_resp.data}")
            return None

        matched_hard = set(_as_list(result.get("matched_hard_skills")))
        missing_hard = set(_as_list(result.get("missing_hard_skills")))
        hard_rows = (
            [{"analysis_id": analysis_id, "skill": skill, "matched": True} for skill in matched_hard]
            + [{"analysis_id": analysis_id, "skill": skill, "matched": False} for skill in missing_hard]
        )
        _safe_child_insert("hard_skills", hard_rows)

        matched_soft = set(_as_list(result.get("matched_soft_skills")))
        missing_soft = set(_as_list(result.get("missing_soft_skills")))
        soft_rows = (
            [{"analysis_id": analysis_id, "skill": skill, "matched": True} for skill in matched_soft]
            + [{"analysis_id": analysis_id, "skill": skill, "matched": False} for skill in missing_soft]
        )
        _safe_child_insert("soft_skills", soft_rows)

        section_rows = []
        for section_name, score_data in (result.get("section_scores") or {}).items():
            if isinstance(score_data, dict):
                score = score_data.get("score")
                feedback = score_data.get("feedback")
            else:
                score = score_data
                feedback = None
            section_rows.append({
                "analysis_id": analysis_id,
                "section_name": section_name,
                "score": score,
                "feedback": feedback,
            })
        _safe_child_insert("section_scores", section_rows)

        print(f"[db] saved analysis {analysis_id} for user {user_id}")
        return analysis_id

    except Exception as exc:
        print(f"[db] save_analysis failed: {exc}")
        return None


def _safe_select_children(table_name: str, columns: str, analysis_id: str) -> list[dict]:
    try:
        response = (
            supabase_client.table(table_name)
            .select(columns)
            .eq("analysis_id", analysis_id)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        print(f"[db] child select failed for {table_name}: {exc}")
        return []


def _hydrate_analysis(analysis: dict) -> dict:
    analysis_id = analysis["id"]
    hard_skills = _safe_select_children("hard_skills", "skill, matched", analysis_id)
    soft_skills = _safe_select_children("soft_skills", "skill, matched", analysis_id)
    section_scores = _safe_select_children("section_scores", "section_name, score, feedback", analysis_id)

    feedback = analysis.get("overall_feedback")
    return {
        "id": analysis_id,
        "created_at": analysis.get("created_at"),
        "job_title": analysis.get("job_title"),
        "ats_score": analysis.get("ats_score"),
        "word_count_feedback": analysis.get("word_count_feedback"),
        "github_status": analysis.get("github_status"),
        "overall_feedback": feedback,
        "feedback": feedback,
        "suggestions": analysis.get("suggestions") or [],
        "matched_hard_skills": [s["skill"] for s in hard_skills if s.get("matched")],
        "missing_hard_skills": [s["skill"] for s in hard_skills if not s.get("matched")],
        "matched_soft_skills": [s["skill"] for s in soft_skills if s.get("matched")],
        "missing_soft_skills": [s["skill"] for s in soft_skills if not s.get("matched")],
        "section_scores": {
            s["section_name"]: {"score": s.get("score"), "feedback": s.get("feedback")}
            for s in section_scores
        },
    }


def get_user_analyses(user_id: str) -> list[dict]:
    """
    Return all past scorecards for a user, newest first.
    """
    try:
        response = (
            supabase_client.table("analyses")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        analyses = response.data or []
        print(f"[db] loaded {len(analyses)} analyses for user {user_id}")
        return [_hydrate_analysis(analysis) for analysis in analyses]
    except Exception as exc:
        print(f"[db] get_user_analyses failed: {exc}")
        raise


def get_single_analysis(analysis_id: str, user_id: str) -> dict | None:
    """
    Return one scorecard, verifying it belongs to the requesting user.
    """
    try:
        response = (
            supabase_client.table("analyses")
            .select("*")
            .eq("id", analysis_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return _hydrate_analysis(response.data)
    except Exception as exc:
        print(f"[db] get_single_analysis failed: {exc}")
        raise
