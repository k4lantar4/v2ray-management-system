from typing import List, Optional
from pydantic import BaseSettings, AnyHttpUrl, validator
from datetime import timedelta

class Settings(BaseSettings):
    # Base
    PROJECT_NAME: str = "V2Ray Management System"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "7.0.0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def validate_allowed_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    # Database
    DATABASE_URL: str
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 5
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # Server Metrics
    METRICS_RETENTION_DAYS: int = 30
    ENABLE_PROMETHEUS: bool = True
    
    # API Documentation
    DOCS_URL: Optional[str] = "/api/docs"
    REDOC_URL: Optional[str] = "/api/redoc"
    OPENAPI_URL: Optional[str] = "/api/openapi.json"
    
    # Security Headers
    SECURITY_HEADERS: bool = True
    HSTS_MAX_AGE: int = 31536000  # 1 year
    
    # Cookie Settings
    COOKIE_SECURE: bool = True
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "Lax"
    
    # 2FA Settings
    ENABLE_2FA: bool = True
    OTP_EXPIRY_SECONDS: int = 300  # 5 minutes
    
    # API Key Settings
    API_KEY_EXPIRE_DAYS: int = 365
    
    # Logging
    LOG_LEVEL: str = "INFO"
    ENABLE_ACCESS_LOG: bool = True
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 5_242_880  # 5MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf"]
    
    # Cache Settings
    CACHE_TTL: int = 300  # 5 minutes
    ENABLE_RESPONSE_CACHE: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Create settings instance
settings = Settings()

# Computed settings
CORS_ORIGINS = settings.ALLOWED_ORIGINS
ACCESS_TOKEN_EXPIRE = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
REFRESH_TOKEN_EXPIRE = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
