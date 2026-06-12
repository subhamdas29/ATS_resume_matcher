import asyncio
import os
from datetime import datetime, timedelta
import httpx

GITHUB_API = "https://api.github.com"


async def get_github_score(username: str):
    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
        "Accept": "application/vnd.github+json",
    }
    commit_headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
        "Accept": "application/vnd.github.cloak-preview+json",
    }

    one_month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    gh_msg = "Cannot find username in GitHub or link invalid. Check the GitHub link in your Resume and try again."

    async with httpx.AsyncClient() as client:

        # check if valid username or not
        user_res = await client.get(f"{GITHUB_API}/users/{username}", headers=headers)
        if user_res.status_code != 200:
            return 0, gh_msg
        user_score = 30
        # 30 points for valid username

        pr_res, commit_res, recent_commit_res = await asyncio.gather(
            client.get(
                f"{GITHUB_API}/search/issues?q=author:{username}+type:pr",
                headers=headers,
            ),
            client.get(
                f"{GITHUB_API}/search/commits?q=author:{username}",
                headers=commit_headers,
            ),
            client.get(
                f"{GITHUB_API}/search/commits?q=author:{username}+author-date:>={one_month_ago}",
                headers=commit_headers,
            )
        )



    pr_count = ( pr_res.json().get("total_count", 0) if pr_res.status_code == 200 else 0 )
    pr_score = min(20, pr_count * 5)

    commit_count = ( commit_res.json().get("total_count", 0) if commit_res.status_code == 200 else 0)
    commit_score = min(30, commit_count * 0.1)

    recent_commits = ( recent_commit_res.json().get("total_count", 0) if recent_commit_res.status_code == 200 else 0 )
    recent_commits_score = 20 if recent_commits > 0 else 0


    score = user_score + pr_score + commit_score + recent_commits_score

    if score == 30:
        gh_msg = "Your GitHub profile is valid, but no open-source tasks have been performed. Consider adding repositories to showcase your practical work."
    elif score <= 45:
        gh_msg = "Your GitHub profile shows some past commit history, but no recent activity. Consider updating your repositories to reflect your current development work."
    elif score <= 60:
        gh_msg = "Your GitHub profile shows intermittent activity. Consider contributing more consistently to open-source or personal projects to truly outshine competition."
    elif score <= 80:
        gh_msg = "Your GitHub profile showcases a solid technical foundation that is highly promising for a fresher. If you already have professional experience, consider increasing your contributions to better reflect your expertise."
    else:
        gh_msg = "Your GitHub profile looks perfect! Your active contributions and strong project history highly complement your application."
    
    return score, gh_msg