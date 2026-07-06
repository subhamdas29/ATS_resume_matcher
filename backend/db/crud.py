"""
db/crud.py

All database operations for ResumePilot.
Called from main.py after calculate_ats_score() returns.
Nothing in the scoring pipeline touches this file.
"""

from db.database import supabase_client


def save_analysis(result: dict, job_title: str, user_id: str) -> str | None:
    """
    Persist a full analysis result to Supabase, linked to the authenticated user.
    """
    try:
        analysis_row = {
            "user_id":             user_id,
            "job_title":           job_title,
            "ats_score":           result.get("ats_score"),
            "word_count_feedback": result.get("word_count_feedback"),
            "github_status":       result.get("github_status"),
            "overall_feedback":    result.get("feedback"),
            "suggestions":         result.get("suggestions", []),
        }
        analysis_resp = (
            supabase_client.table("analyses")
            .insert(analysis_row)
            .execute()
        )
        analysis_id = analysis_resp.data[0]["id"]

        matched_hard = set(result.get("matched_hard_skills", []))
        missing_hard = set(result.get("missing_hard_skills", []))
        all_hard = [
            {"analysis_id": analysis_id, "skill": s, "matched": True}
            for s in matched_hard
        ] + [
            {"analysis_id": analysis_id, "skill": s, "matched": False}
            for s in missing_hard
        ]
        if all_hard:
            supabase_client.table("hard_skills").insert(all_hard).execute()

        matched_soft = set(result.get("matched_soft_skills", []))
        missing_soft = set(result.get("missing_soft_skills", []))
        all_soft = [
            {"analysis_id": analysis_id, "skill": s, "matched": True}
            for s in matched_soft
        ] + [
            {"analysis_id": analysis_id, "skill": s, "matched": False}
            for s in missing_soft
        ]
        if all_soft:
            supabase_client.table("soft_skills").insert(all_soft).execute()

        section_scores_raw = result.get("section_scores", {})
        section_rows = []
        for section_name, score_data in section_scores_raw.items():
            if isinstance(score_data, dict):
                score    = score_data.get("score")
                feedback = score_data.get("feedback")
            else:
                score    = score_data
                feedback = None
            section_rows.append({
                "analysis_id":  analysis_id,
                "section_name": section_name,
                "score":        score,
                "feedback":     feedback,
            })
        if section_rows:
            supabase_client.table("section_scores").insert(section_rows).execute()

        return analysis_id

    except Exception as e:
        print(f"[db] save_analysis failed: {e}")
        return None


def get_user_analyses(user_id: str) -> list[dict]:
    """
    Return all past scorecards for a user, newest first.
    """
    try:
        analyses_resp = (
            supabase_client.table("analyses")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        analyses = analyses_resp.data
        if not analyses:
            return []

        result = []
        for analysis in analyses:
            aid = analysis["id"]

            hard_resp    = supabase_client.table("hard_skills").select("skill, matched").eq("analysis_id", aid).execute()
            soft_resp    = supabase_client.table("soft_skills").select("skill, matched").eq("analysis_id", aid).execute()
            section_resp = supabase_client.table("section_scores").select("section_name, score, feedback").eq("analysis_id", aid).execute()

            hard_skills    = hard_resp.data or []
            soft_skills    = soft_resp.data or []
            section_scores = section_resp.data or []

            result.append({
                "id":                  aid,
                "created_at":          analysis["created_at"],
                "job_title":           analysis["job_title"],
                "ats_score":           analysis["ats_score"],
                "word_count_feedback": analysis["word_count_feedback"],
                "github_status":       analysis["github_status"],
                "overall_feedback":    analysis["overall_feedback"],
                "suggestions":         analysis["suggestions"] or [],
                "matched_hard_skills": [s["skill"] for s in hard_skills if s["matched"]],
                "missing_hard_skills": [s["skill"] for s in hard_skills if not s["matched"]],
                "matched_soft_skills": [s["skill"] for s in soft_skills if s["matched"]],
                "missing_soft_skills": [s["skill"] for s in soft_skills if not s["matched"]],
                "section_scores":      {s["section_name"]: {"score": s["score"], "feedback": s["feedback"]} for s in section_scores},
            })

        return result

    except Exception as e:
        print(f"[db] get_user_analyses failed: {e}")
        return []


def get_single_analysis(analysis_id: str, user_id: str) -> dict | None:
    """
    Return one specific scorecard, verifying it belongs to the requesting user.
    """
    try:
        analysis_resp = (
            supabase_client.table("analyses")
            .select("*")
            .eq("id", analysis_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        analysis = analysis_resp.data
        if not analysis:
            return None

        aid = analysis["id"]
        hard_resp    = supabase_client.table("hard_skills").select("skill, matched").eq("analysis_id", aid).execute()
        soft_resp    = supabase_client.table("soft_skills").select("skill, matched").eq("analysis_id", aid).execute()
        section_resp = supabase_client.table("section_scores").select("section_name, score, feedback").eq("analysis_id", aid).execute()

        hard_skills    = hard_resp.data or []
        soft_skills    = soft_resp.data or []
        section_scores = section_resp.data or []

        return {
            "id":                  aid,
            "created_at":          analysis["created_at"],
            "job_title":           analysis["job_title"],
            "ats_score":           analysis["ats_score"],
            "word_count_feedback": analysis["word_count_feedback"],
            "github_status":       analysis["github_status"],
            "overall_feedback":    analysis["overall_feedback"],
            "suggestions":         analysis["suggestions"] or [],
            "matched_hard_skills": [s["skill"] for s in hard_skills if s["matched"]],
            "missing_hard_skills": [s["skill"] for s in hard_skills if not s["matched"]],
            "matched_soft_skills": [s["skill"] for s in soft_skills if s["matched"]],
            "missing_soft_skills": [s["skill"] for s in soft_skills if not s["matched"]],
            "section_scores":      {s["section_name"]: {"score": s["score"], "feedback": s["feedback"]} for s in section_scores},
        }

    except Exception as e:
        print(f"[db] get_single_analysis failed: {e}")
        return None