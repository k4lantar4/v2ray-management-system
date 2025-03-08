"""
Base models for the application
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class TimestampModel(SQLModel):
    """Base model with timestamp fields"""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class BaseModel(TimestampModel):
    """Base model with ID and timestamp fields"""
    id: Optional[int] = Field(default=None, primary_key=True)
    is_active: bool = Field(default=True, nullable=False)
    is_deleted: bool = Field(default=False, nullable=False)
    
    class Config:
        """Model configuration"""
        arbitrary_types_allowed = True

    def dict(self, *args, **kwargs):
        """Convert model to dictionary excluding None values"""
        kwargs.pop("exclude_none", None)
        return super().dict(*args, exclude_none=True, **kwargs)
