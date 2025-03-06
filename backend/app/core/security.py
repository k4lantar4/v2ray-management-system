from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password
    """
    return pwd_context.hash(password)

class SecurityUtils:
    @staticmethod
    def verify_2fa_code(user_id: int, code: str) -> bool:
        """
        Verify 2FA code sent to user's Telegram
        To be implemented with Redis for temporary code storage
        """
        # TODO: Implement 2FA verification logic
        return True

    @staticmethod
    def generate_2fa_code(user_id: int) -> str:
        """
        Generate and store 2FA code
        To be implemented with Redis for temporary storage
        """
        # TODO: Implement 2FA code generation logic
        return "123456"  # Placeholder

    @staticmethod
    def is_valid_iranian_phone(phone: str) -> bool:
        """
        Validate Iranian phone number format (+98XXXXXXXXXX)
        """
        if not phone or not isinstance(phone, str):
            return False
        return phone.startswith("+98") and len(phone) == 13 and phone[1:].isdigit()
