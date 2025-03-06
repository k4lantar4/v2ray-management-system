from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import uvicorn
import logging
from datetime import datetime

from .core.config import settings
from .db.session import init_db
from .api.endpoints import (
    auth,
    users,
    servers,
    subscriptions,
    payments,
    discounts,
    tickets,
    admin
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.utcnow()
    response = await call_next(request)
    end_time = datetime.utcnow()
    
    logger.info(
        f"Path: {request.url.path} "
        f"Method: {request.method} "
        f"Status: {response.status_code} "
        f"Duration: {(end_time - start_time).total_seconds():.3f}s"
    )
    return response

# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"]
)
app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["users"]
)
app.include_router(
    servers.router,
    prefix=f"{settings.API_V1_STR}/servers",
    tags=["servers"]
)
app.include_router(
    subscriptions.router,
    prefix=f"{settings.API_V1_STR}/subscriptions",
    tags=["subscriptions"]
)
app.include_router(
    payments.router,
    prefix=f"{settings.API_V1_STR}/payments",
    tags=["payments"]
)
app.include_router(
    discounts.router,
    prefix=f"{settings.API_V1_STR}/discounts",
    tags=["discounts"]
)
app.include_router(
    tickets.router,
    prefix=f"{settings.API_V1_STR}/tickets",
    tags=["tickets"]
)
app.include_router(
    admin.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["admin"]
)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Additional startup tasks can be added here
        # For example: Initialize Redis cache, setup background tasks, etc.
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise e

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "VPN Subscription Management API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=4
    )
