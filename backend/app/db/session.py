from typing import Generator
from sqlmodel import Session, SQLModel, create_engine
from ..core.config import settings

# Create database URL with proper encoding for MySQL
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("mysql"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+mysqldb://")
    if "?" not in DATABASE_URL:
        DATABASE_URL += "?charset=utf8mb4"

# Create engine with proper configurations
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Enable connection pool pre-ping
    pool_recycle=3600,   # Recycle connections every hour
    echo=False           # Set to True for SQL query logging
)

def init_db() -> None:
    """Initialize database with all models"""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        try:
            yield session
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

class DatabaseSession:
    """Context manager for database sessions"""
    def __init__(self):
        self.session = Session(engine)

    def __enter__(self) -> Session:
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            self.session.close()

# Redis connection setup
from redis import Redis
from ..core.config import settings

redis_client = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True,  # Automatically decode responses to str
    socket_timeout=5,       # Socket timeout in seconds
    retry_on_timeout=True   # Retry on timeout
)

def get_redis() -> Redis:
    """Get Redis client"""
    try:
        redis_client.ping()
        return redis_client
    except Exception as e:
        raise Exception(f"Redis connection failed: {str(e)}")

class RedisSession:
    """Context manager for Redis operations"""
    def __init__(self):
        self.redis = get_redis()

    def __enter__(self) -> Redis:
        return self.redis

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Redis doesn't need explicit cleanup
        pass

# Cache decorator
from functools import wraps
from datetime import timedelta
import json

def cache(ttl_seconds: int = 300):
    """Cache decorator for Redis"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            with RedisSession() as redis:
                cached_result = redis.get(cache_key)
                if cached_result:
                    return json.loads(cached_result)
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                redis.setex(
                    cache_key,
                    ttl_seconds,
                    json.dumps(result)
                )
                return result
        return wrapper
    return decorator
