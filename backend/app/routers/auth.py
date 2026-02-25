from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserCreate, User, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.crud import user as user_crud
from app.auth.utils import verify_password, create_access_token, verify_token
from app.auth.dependencies import get_current_active_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if this is the first user (will be admin)
    user_count = await user_crud.get_user_count(db)
    is_first_user = user_count == 0

    # Check if email already exists
    db_user = await user_crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    db_user = await user_crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user (first user is admin)
    return await user_crud.create_user(db, user=user, is_admin=is_first_user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Try to authenticate with username or email
    user = await user_crud.get_user_by_username(db, username=form_data.username)
    if not user:
        user = await user_crud.get_user_by_email(db, email=form_data.username)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    user = await user_crud.get_user_by_email(db, email=request.email)
    if not user:
        # Return success even if user not found to prevent user enumeration
        return {"message": "If an account exists with this email, you will receive a reset link."}

    # Create temporary reset token (valid for 15 minutes)
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "reset_password"},
        expires_delta=timedelta(minutes=15)
    )

    # In a real app, send email here. For now, print to console.
    print(f"\n[PASSWORD RESET] User: {user.username}, Email: {user.email}")
    print(f"[PASSWORD RESET] Token: {reset_token}")
    print(f"[PASSWORD RESET] Client Link: http://localhost:3000/reset-password?token={reset_token}\n")

    return {"message": "If an account exists with this email, you will receive a reset link."}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    payload = verify_token(request.token)
    if not payload or payload.get("purpose") != "reset_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user_id = int(payload.get("sub"))
    success = await user_crud.update_password(db, user_id=user_id, new_password=request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "Password updated successfully"}
