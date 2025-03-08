"""
User model for the application
"""

from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from .base import BaseModel, TimestampModel
from .backup import BackupMetadata
from .activity_log import ActivityLog

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPPORT = "support"
    USER = "user"
    VIP = "vip"

class UserStatus(str, Enum):
    ACTIVE = "active"
    BLOCKED = "blocked"
    PENDING = "pending"

class UserBase(SQLModel):
    """Base User model"""
    telegram_id: int = Field(unique=True, index=True)
    username: Optional[str] = Field(default=None, max_length=32)
    first_name: str = Field(max_length=64)
    last_name: Optional[str] = Field(default=None, max_length=64)
    credit: float = Field(default=0.0)
    is_active: bool = Field(default=True)
    is_banned: bool = Field(default=False)
    language: str = Field(default="fa")

class User(UserBase, TimestampModel, table=True):
    """User model with relationships"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    subscriptions: List["Subscription"] = Relationship(back_populates="user")
    transactions: List["Transaction"] = Relationship(back_populates="user")
    payments: List["Payment"] = Relationship(back_populates="user")
    tickets: List["Ticket"] = Relationship(back_populates="user")
    activities: List["ActivityLog"] = Relationship(back_populates="user")
    created_backups: List["BackupMetadata"] = Relationship(
        back_populates="creator",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan"
        }
    )

    class Config:
        """Model configuration"""
        arbitrary_types_allowed = True

class UserCreate(UserBase):
    """User creation schema"""
    pass

class UserUpdate(SQLModel):
    """User update schema"""
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    credit: Optional[float] = None
    is_active: Optional[bool] = None
    is_banned: Optional[bool] = None
    language: Optional[str] = None

class UserRead(UserBase):
    """User read schema"""
    id: int
    created_at: datetime
    updated_at: datetime

class UserWithSubscriptions(UserRead):
    """Schema for user data with subscriptions"""
    subscriptions: List["SubscriptionRead"] = []
    recent_activities: List["ActivityLog"] = []
    recent_backups: List["BackupMetadata"] = []

    class Config:
        orm_mode = True

# Prevent circular imports
from .subscription import SubscriptionRead
UserWithSubscriptions.update_forward_refs()
