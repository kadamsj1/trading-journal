import logging
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.auth.utils import verify_token

logger = logging.getLogger(__name__)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _extract_token(request: Request) -> str | None:
    """
    Extract JWT token from:
    1. HttpOnly cookie 'access_token'  ← preferred (browser)
    2. Authorization: Bearer header    ← fallback (API clients / Swagger)
    """
    # 1. Cookie (secure — not accessible to JavaScript)
    token = request.cookies.get("access_token")
    if token:
        return token

    # 2. Bearer header fallback
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]

    return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = _extract_token(request)
    if not token:
        raise _CREDENTIALS_EXCEPTION

    payload = verify_token(token)
    if payload is None:
        raise _CREDENTIALS_EXCEPTION

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise _CREDENTIALS_EXCEPTION

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise _CREDENTIALS_EXCEPTION

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
