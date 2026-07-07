"""
auth.py

FastAPI dependency that verifies the Supabase JWT from the
Authorization header and returns the authenticated user's ID.

Usage in main.py:
    from auth import get_current_user

    @app.post("/analyze")
    async def analyze(user_id: str = Depends(get_current_user), ...):
        ...
"""

import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()
_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
_ALGORITHM  = "HS256"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    Verify the Bearer JWT and return the user's UUID (sub claim).

    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            _JWT_SECRET,
            algorithms=[_ALGORITHM],
            options={"verify_aud": False},  # Supabase JWTs use "authenticated" audience
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired — please log in again",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )