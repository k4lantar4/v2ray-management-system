from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class TimestampModel(SQLModel):
    """Base model with created and updated timestamps"""
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class BaseModel(TimestampModel):
    """Base model with ID and timestamps"""
    id: Optional[int] = Field(default=None, primary_key=True)
    is_active: bool = Field(default=True, nullable=False)
    is_deleted: bool = Field(default=False, nullable=False)

    def dict(self, *args, **kwargs):
        """Convert model to dictionary excluding None values"""
        kwargs.pop("exclude_none", None)
        return super().dict(*args, exclude_none=True, **kwargs)
