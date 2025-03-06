from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ...core.config import settings
from ...core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    SecurityUtils
)
from ...db.session import get_session
from ...db.models.user import User, UserCreate, UserRead
from ..deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserRead)
async def register(
    *,
    db: Session = Depends(get_session),
    user_in: UserCreate
) -> Any:
    """
    Register new user.
    """
    # Validate phone number format
    if not SecurityUtils.is_valid_iranian_phone(user_in.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Must be +98XXXXXXXXXX"
        )

    # Check if user exists
    user = db.exec(
        select(User).where(User.phone == user_in.phone)
    ).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists"
        )

    # Create new user
    db_user = User(
        phone=user_in.phone,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password) if user_in.password else None,
        telegram_id=user_in.telegram_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.post("/login/access-token")
async def login_access_token(
    db: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Try to authenticate the user
    user = db.exec(
        select(User).where(User.phone == form_data.username)
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login/2fa-verify")
async def verify_2fa(
    *,
    code: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Verify 2FA code sent to user's Telegram.
    """
    if not SecurityUtils.verify_2fa_code(current_user.id, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    return {"msg": "2FA verification successful"}

@router.post("/login/2fa-request")
async def request_2fa(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Request new 2FA code to be sent via Telegram.
    """
    if not current_user.telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Telegram account linked"
        )

    code = SecurityUtils.generate_2fa_code(current_user.id)
    # TODO: Send code via Telegram bot
    return {"msg": "2FA code sent"}

@router.post("/password-reset/request")
async def request_password_reset(
    phone: str,
    db: Session = Depends(get_session)
) -> Any:
    """
    Request password reset via 2FA.
    """
    user = db.exec(
        select(User).where(User.phone == phone)
    ).first()
    if not user:
        # Return success even if user doesn't exist to prevent user enumeration
        return {"msg": "If user exists, reset code will be sent"}

    if not user.telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Telegram account linked"
        )

    code = SecurityUtils.generate_2fa_code(user.id)
    # TODO: Send code via Telegram bot
    return {"msg": "Reset code sent"}

@router.post("/password-reset/verify")
async def verify_password_reset(
    *,
    phone: str,
    code: str,
    new_password: str,
    db: Session = Depends(get_session)
) -> Any:
    """
    Reset password using 2FA code.
    """
    user = db.exec(
        select(User).where(User.phone == phone)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    if not SecurityUtils.verify_2fa_code(user.id, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code"
        )

    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()

    return {"msg": "Password reset successful"}

@router.post("/telegram/link")
async def link_telegram(
    *,
    telegram_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> Any:
    """
    Link Telegram account to user profile.
    """
    # Check if Telegram ID is already linked
    existing_user = db.exec(
        select(User).where(User.telegram_id == telegram_id)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram account already linked to another user"
        )

    current_user.telegram_id = telegram_id
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user

@router.get("/me", response_model=UserRead)
async def read_current_user(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user information.
    """
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> Any:
    """
    Logout current user (update last logout time).
    """
    current_user.last_login = None
    db.add(current_user)
    db.commit()
    return {"msg": "Successfully logged out"}
