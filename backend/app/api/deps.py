from typing import Generator, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session
from datetime import datetime

from ..core.config import settings
from ..core.security import SecurityUtils
from ..db.session import get_session, get_redis
from ..db.models.user import User, UserRole
from redis import Redis

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator[Session, None, None]:
    """Dependency for database session"""
    return get_session()

def get_redis_client() -> Redis:
    """Dependency for Redis client"""
    return get_redis()

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.get(User, int(user_id))
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active superuser"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_current_active_staff(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active staff member (admin or support)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

class RateLimiter:
    """Rate limiter using Redis"""
    def __init__(
        self,
        times: int = 100,  # Number of requests
        seconds: int = 60,  # Time window in seconds
        prefix: str = "rate_limit"
    ):
        self.times = times
        self.seconds = seconds
        self.prefix = prefix

    async def __call__(
        self,
        redis: Redis = Depends(get_redis_client),
        current_user: Optional[User] = Depends(get_current_user)
    ):
        if current_user and current_user.role == UserRole.ADMIN:
            return  # No rate limiting for admins
            
        key = f"{self.prefix}:{current_user.id if current_user else 'anonymous'}"
        
        # Initialize if not exists
        requests = redis.get(key)
        if not requests:
            redis.setex(key, self.seconds, 1)
            return
        
        requests = int(requests)
        if requests >= self.times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests"
            )
            
        redis.incr(key)

def verify_2fa(
    code: str,
    current_user: User = Depends(get_current_user)
) -> bool:
    """Verify 2FA code"""
    if not SecurityUtils.verify_2fa_code(current_user.id, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    return True

# Common dependencies
CommonDeps = Depends(get_current_active_user)
AdminDeps = Depends(get_current_active_superuser)
StaffDeps = Depends(get_current_active_staff)
RateLimit = RateLimiter()
