from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from .base import BaseModel

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
    phone: str = Field(unique=True, index=True)
    telegram_id: Optional[int] = Field(default=None, unique=True, index=True)
    full_name: Optional[str] = Field(default=None)
    role: UserRole = Field(default=UserRole.USER)
    status: UserStatus = Field(default=UserStatus.PENDING)
    wallet_balance: float = Field(default=0.0)
    language: str = Field(default="fa")

class User(BaseModel, UserBase, table=True):
    """User model with all relationships"""
    hashed_password: Optional[str] = Field(default=None)
    last_login: Optional[datetime] = Field(default=None)
    
    # Relationships
    subscriptions: List["Subscription"] = Relationship(back_populates="user")
    payments: List["Payment"] = Relationship(back_populates="user")
    tickets: List["Ticket"] = Relationship(back_populates="user")

    class Config:
        arbitrary_types_allowed = True

class UserCreate(UserBase):
    """Schema for user creation"""
    password: Optional[str] = None

class UserUpdate(SQLModel):
    """Schema for user update"""
    phone: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    wallet_balance: Optional[float] = None
    language: Optional[str] = None

class UserRead(UserBase):
    """Schema for reading user data"""
    id: int
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        orm_mode = True

class UserWithSubscriptions(UserRead):
    """Schema for user data with subscriptions"""
    subscriptions: List["SubscriptionRead"] = []

    class Config:
        orm_mode = True

# Prevent circular imports
from .subscription import SubscriptionRead
UserWithSubscriptions.update_forward_refs()
