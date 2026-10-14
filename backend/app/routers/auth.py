import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
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

# Rate limiter instance (uses IP by default)
limiter = Limiter(key_func=get_remote_address)

# Generic auth error — prevents account enumeration
_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect username or password",
    headers={"WWW-Authenticate": "Bearer"},
)


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user. Rate-limited to 5 per minute per IP."""
    # Validate password strength
    _validate_password_strength(user.password)

    # Check if this is the first user (becomes admin)
    user_count = await user_crud.get_user_count(db)
    is_first_user = user_count == 0

    # Use constant-time checks (same error message to prevent enumeration)
    db_user_email = await user_crud.get_user_by_email(db, email=user.email)
    db_user_username = await user_crud.get_user_by_username(db, username=user.username)

    if db_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if db_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    return await user_crud.create_user(db, user=user, is_admin=is_first_user)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login endpoint. Rate-limited to 10 per minute per IP."""
    try:
        user = await user_crud.get_user_by_username(db, username=form_data.username)
        if not user:
            user = await user_crud.get_user_by_email(db, email=form_data.username)

        # Use same error for wrong user/wrong password to prevent enumeration
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise _INVALID_CREDENTIALS

        if not user.is_active:
            raise HTTPException(status_code=400, detail="Account is inactive")

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        logger.info("User %d logged in successfully", user.id)
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception:
        # Log internally but never return internal details to client
        logger.exception("Unexpected error during login for username=%s", form_data.username)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request a password reset link. Rate-limited to 3 per minute per IP."""
    # Always return same response to prevent email enumeration
    _GENERIC_RESET_MSG = {"message": "If an account exists with this email, you will receive a reset link."}

    user = await user_crud.get_user_by_email(db, email=body.email)
    if not user:
        return _GENERIC_RESET_MSG

    # Create short-lived reset token (15 min)
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "reset_password"},
        expires_delta=timedelta(minutes=15)
    )

    try:
        await send_reset_password_email(
            email_to=user.email,
            token=reset_token,
            username=user.username
        )
    except Exception:
        logger.exception("Failed to send reset email to user_id=%d", user.id)
        # Still return generic response — don't reveal email send failures

    return _GENERIC_RESET_MSG


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using a valid token. Rate-limited to 5 per minute per IP."""
    _INVALID_TOKEN = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired reset token"
    )

    payload = verify_token(body.token)
    if not payload or payload.get("purpose") != "reset_password":
        raise _INVALID_TOKEN

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise _INVALID_TOKEN

    # Validate new password strength before applying
    _validate_password_strength(body.new_password)

    success = await user_crud.update_password(db, user_id=user_id, new_password=body.new_password)
    if not success:
        raise _INVALID_TOKEN  # Don't reveal that user doesn't exist

    logger.info("Password reset completed for user_id=%d", user_id)
    return {"message": "Password updated successfully"}


def _validate_password_strength(password: str) -> None:
    """Enforce minimum password policy."""
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
            detail=f"Password must contain: {', '.join(errors)}"
        )
