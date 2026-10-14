import logging
import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.schemas.user import UserCreate, User, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.crud import user as user_crud
from app.auth.utils import verify_password, create_access_token, verify_token
from app.auth.dependencies import get_current_active_user
from app.config import get_settings
from app.utils.email import send_reset_password_email

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

# Cookie settings
COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect username or password",
    headers={"WWW-Authenticate": "Bearer"},
)


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set JWT as HttpOnly, Secure, SameSite cookie."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,               # ← JavaScript ला दिसत नाही (XSS safe)
        secure=IS_PRODUCTION,        # ← Production मध्ये HTTPS only
        samesite="lax",              # ← CSRF protection
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie on logout."""
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
    )


def _validate_password_strength(password: str) -> None:
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not any(c.isupper() for c in password):
        errors.append("at least one uppercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("at least one digit")
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Password must contain: {', '.join(errors)}",
        )


# ── Register ─────────────────────────────────────────────────

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user. Rate-limited: 5/minute per IP."""
    _validate_password_strength(user.password)

    user_count = await user_crud.get_user_count(db)
    is_first_user = user_count == 0

    if await user_crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await user_crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    return await user_crud.create_user(db, user=user, is_admin=is_first_user)


# ── Login ─────────────────────────────────────────────────────

@router.post("/login", response_model=User)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login with username/email + password.
    Sets a secure HttpOnly cookie with the JWT token.
    Rate-limited: 10/minute per IP.
    """
    try:
        user = await user_crud.get_user_by_username(db, username=form_data.username)
        if not user:
            user = await user_crud.get_user_by_email(db, email=form_data.username)

        if not user or not verify_password(form_data.password, user.hashed_password):
            raise _INVALID_CREDENTIALS

        if not user.is_active:
            raise HTTPException(status_code=400, detail="Account is inactive")

        # Create token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        # ✅ Set HttpOnly cookie — JavaScript ला दिसत नाही
        _set_auth_cookie(response, access_token)

        logger.info("User %d logged in successfully", user.id)
        # Return user info (token is in cookie, not in response body)
        return user

    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error during login")
        raise HTTPException(status_code=500, detail="Internal server error")


# ── Logout ────────────────────────────────────────────────────

@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie — server-side logout."""
    _clear_auth_cookie(response)
    return {"message": "Logged out successfully"}


# ── Me ────────────────────────────────────────────────────────

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ── Forgot Password ───────────────────────────────────────────

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rate-limited: 3/minute per IP."""
    _GENERIC = {"message": "If an account exists with this email, you will receive a reset link."}

    user = await user_crud.get_user_by_email(db, email=body.email)
    if not user:
        return _GENERIC

    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "reset_password"},
        expires_delta=timedelta(minutes=15),
    )
    try:
        await send_reset_password_email(
            email_to=user.email,
            token=reset_token,
            username=user.username,
        )
    except Exception:
        logger.exception("Failed to send reset email to user_id=%d", user.id)

    return _GENERIC


# ── Reset Password ────────────────────────────────────────────

@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rate-limited: 5/minute per IP."""
    _INVALID = HTTPException(status_code=400, detail="Invalid or expired reset token")

    payload = verify_token(body.token)
    if not payload or payload.get("purpose") != "reset_password":
        raise _INVALID

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise _INVALID

    _validate_password_strength(body.new_password)

    success = await user_crud.update_password(db, user_id=user_id, new_password=body.new_password)
    if not success:
        raise _INVALID

    logger.info("Password reset for user_id=%d", user_id)
    return {"message": "Password updated successfully"}
