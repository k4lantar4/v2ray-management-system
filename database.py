"""
🗄️ Database Configuration and Connection Management
Handles database setup, connection pooling, and session management
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlmodel import SQLModel

from backend.app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database connection manager"""
    
    _instance: Optional['DatabaseManager'] = None
    _engine = None
    _async_session_maker = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize database connection"""
        if not self._engine:
            self._setup_engine()
    
    def _setup_engine(self):
        """Set up database engine with connection pooling"""
        try:
            # Create async engine with optimized pool settings
            self._engine = create_async_engine(
                settings.SQLALCHEMY_DATABASE_URI,
                echo=settings.DEBUG,
                pool_size=20,
                max_overflow=10,
                pool_timeout=30,
                pool_recycle=1800,  # Recycle connections after 30 minutes
                pool_pre_ping=True,  # Enable connection health checks
                poolclass=AsyncAdaptedQueuePool
            )
            
            # Create async session maker
            self._async_session_maker = sessionmaker(
                self._engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False
            )
            
            logger.info("✅ Database engine initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize database engine: {str(e)}")
            raise
    
    @property
    def engine(self):
        """Get database engine"""
        return self._engine
    
    @property
    def async_session_maker(self):
        """Get async session maker"""
        return self._async_session_maker
    
    async def create_all(self):
        """Create all database tables"""
        try:
            async with self._engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
            logger.info("✅ Database tables created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create database tables: {str(e)}")
            raise
    
    async def drop_all(self):
        """Drop all database tables"""
        try:
            async with self._engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.drop_all)
            logger.info("✅ Database tables dropped successfully")
        except Exception as e:
            logger.error(f"❌ Failed to drop database tables: {str(e)}")
            raise
    
    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session with automatic cleanup"""
        session: AsyncSession = self._async_session_maker()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Database session error: {str(e)}")
            raise
        finally:
            await session.close()
    
    async def check_connection(self) -> bool:
        """Check database connection"""
        try:
            async with self._engine.connect() as conn:
                await conn.execute("SELECT 1")
            logger.info("✅ Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {str(e)}")
            return False
    
    async def get_pool_status(self) -> dict:
        """Get connection pool status"""
        return {
            "size": self._engine.pool.size(),
            "checked_out": self._engine.pool.checkedin(),
            "overflow": self._engine.pool.overflow(),
            "checkedout": self._engine.pool.checkedout()
        }

# Create global database manager instance
db_manager = DatabaseManager()

# Async session dependency
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with db_manager.session() as session:
        yield session

# Health check function
async def check_database_health() -> dict:
    """Check database health status"""
    try:
        connection_ok = await db_manager.check_connection()
        pool_status = await db_manager.get_pool_status()
        
        return {
            "status": "healthy" if connection_ok else "unhealthy",
            "connection": connection_ok,
            "pool": pool_status,
            "message": "Database is operational" if connection_ok else "Database connection failed"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "connection": False,
            "error": str(e),
            "message": "Failed to check database health"
        }

# Initialize database
async def init_database():
    """Initialize database tables and connections"""
    try:
        await db_manager.create_all()
        health_status = await check_database_health()
        
        if health_status["status"] == "healthy":
            logger.info("✅ Database initialization completed successfully")
            return True
        else:
            logger.error("❌ Database initialization failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database initialization error: {str(e)}")
        return False
