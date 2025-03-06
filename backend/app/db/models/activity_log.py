from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel, JSON
from .base import BaseModel

class ActivityLog(BaseModel, table=True):
    """Model for storing activity logs"""
    
    __tablename__ = "activity_logs"
    
    activity_type: str = Field(index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    details: Dict[str, Any] = Field(default={}, sa_type=JSON)
    ip_address: Optional[str] = Field(default=None)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    class Config:
        schema_extra = {
            "example": {
                "activity_type": "login",
                "user_id": 1,
                "details": {"browser": "Chrome", "platform": "Windows"},
                "ip_address": "192.168.1.1",
                "timestamp": "2024-03-08T12:00:00"
            }
        }
