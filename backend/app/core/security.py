from datetime import datetime, timedelta
from typing import Any, Optional, Union, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
import secrets
import pyotp
from redis import Redis
from .config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis client for temporary storage (2FA, refresh tokens)
redis_client = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True
)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    fresh: bool = False,
    additional_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Create JWT access token with enhanced security
    
    Args:
        subject: Token subject (usually user ID)
        expires_delta: Optional custom expiration time
        fresh: Whether this is a fresh login token
        additional_claims: Additional claims to include in token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(32),  # Unique token ID
        "fresh": fresh
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # Store token ID in Redis for blacklisting capability
    redis_client.setex(
        f"valid_token:{to_encode['jti']}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "1"
    )
    
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create refresh token"""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token = create_access_token(
        subject,
        expires_delta=expires_delta,
        fresh=False,
        additional_claims={"type": "refresh"}
    )
    return token

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token with additional security checks
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check if token has been blacklisted
        token_id = payload.get("jti")
        if not token_id or not redis_client.exists(f"valid_token:{token_id}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated"
            )
        
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

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

def blacklist_token(token: str) -> None:
    """
    Blacklist a token by removing it from valid tokens in Redis
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        token_id = payload.get("jti")
        if token_id:
            redis_client.delete(f"valid_token:{token_id}")
    except JWTError:
        pass

class SecurityUtils:
    @staticmethod
    def generate_2fa_secret() -> str:
        """Generate new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def verify_2fa_code(secret: str, code: str) -> bool:
        """
        Verify 2FA code using TOTP
        """
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    @staticmethod
    def generate_2fa_code(secret: str) -> str:
        """
        Generate current TOTP code
        """
        totp = pyotp.TOTP(secret)
        return totp.now()

    @staticmethod
    def is_valid_iranian_phone(phone: str) -> bool:
        """
        Validate Iranian phone number format (+98XXXXXXXXXX)
        """
        if not phone or not isinstance(phone, str):
            return False
        return phone.startswith("+98") and len(phone) == 13 and phone[1:].isdigit()

    @staticmethod
    def generate_api_key() -> str:
        """Generate secure API key"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for storage"""
        return pwd_context.hash(api_key)

    @staticmethod
    def verify_api_key(plain_api_key: str, hashed_api_key: str) -> bool:
        """Verify API key"""
        return pwd_context.verify(plain_api_key, hashed_api_key)
