from datetime import datetime, timedelta
import logging
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from .middleware.rate_limit import rate_limiter
from .api.endpoints import (
    auth, users, subscriptions, payments, discounts, 
    tickets, servers, admin, admin_backup
)
from .services.backup import backup_service
from .bot.telegram_bot import start_bot, stop_bot
from .core.config import settings
import uuid
import redis

logger = logging.getLogger(__name__)

app = FastAPI(
    title="V2Ray Management System",
    description="API for V2Ray account management and monitoring",
    version="7.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    route_key = request.url.path
    
    # Skip rate limiting for certain paths
    if route_key.startswith("/static/") or route_key.startswith("/api/health"):
        return await call_next(request)
    
    redis_key = f"rate_limit:{client_ip}:{route_key}"
    
    async with redis.Redis() as redis_client:
        requests = await redis_client.incr(redis_key)
        if requests == 1:
            await redis_client.expire(redis_key, 60)  # 1 minute window
        
        if requests > 100:  # 100 requests per minute limit
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "status_code": 429,
                    "retry_after": 60
                }
            )
    
    response = await call_next(request)
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "7.0.0"
    }

# Include routers with versioned API paths
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["Subscriptions"])
app.include_router(payments.router, prefix="/api/v1", tags=["Payments"])
app.include_router(discounts.router, prefix="/api/v1", tags=["Discounts"])
app.include_router(tickets.router, prefix="/api/v1", tags=["Support Tickets"])
app.include_router(servers.router, prefix="/api/v1", tags=["Servers"])
app.include_router(admin.router, prefix="/api/v1", tags=["Administration"])
app.include_router(admin_backup.router, prefix="/api/v1/admin", tags=["System Backup"])

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.detail} - Status: {exc.status_code} - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)} - Path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred. Please try again later.",
            "status_code": 500,
            "path": request.url.path,
            "method": request.method,
            "timestamp": datetime.utcnow().isoformat(),
            "error_id": str(uuid.uuid4())  # For tracking in logs
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    # Initialize rate limiter cleanup task
    await rate_limiter.start_cleanup()
    
    # Create initial backup directory
    backup_service.backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Start Telegram bot
    try:
        if settings.TELEGRAM_BOT_ENABLED:
            logger.info("Starting Telegram bot...")
            asyncio.create_task(start_bot())
    except Exception as e:
        logger.error(f"Failed to start Telegram bot: {str(e)}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    # Cleanup tasks
    try:
        # Clean up old backups based on retention policy
        backups = await backup_service.list_backups()
        retention_days = settings.BACKUP_RETENTION_DAYS
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        for backup in backups:
            backup_date = datetime.strptime(backup["timestamp"], "%Y%m%d_%H%M%S")
            if backup_date < cutoff_date:
                await backup_service.delete_backup(backup["path"])
                
        # Stop Telegram bot
        if settings.TELEGRAM_BOT_ENABLED:
            logger.info("Stopping Telegram bot...")
            await stop_bot()
    except Exception as e:
        logger.error(f"Error during shutdown cleanup: {str(e)}")
