"""
Subscription model for user subscriptions
"""

from typing import Optional, List, ForwardRef
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from .base import BaseModel, TimestampModel

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    PENDING = "pending"

class SubscriptionBase(SQLModel):
    """Base Subscription model"""
    user_id: int = Field(foreign_key="user.id")
    server_id: int = Field(foreign_key="server.id")
    plan_id: int = Field(foreign_key="plan.id")
    name: str = Field(max_length=64)
    status: str = Field(default="active")  # active, expired, suspended
    expire_date: datetime
    total_traffic: int  # In GB
    used_traffic: int = Field(default=0)  # In GB
    upload: int = Field(default=0)  # In bytes
    download: int = Field(default=0)  # In bytes
    settings: dict = Field(default_factory=dict)  # V2Ray specific settings

class Subscription(SubscriptionBase, TimestampModel, table=True):
    """Subscription model with relationships"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    user: "User" = Relationship(back_populates="subscriptions")
    server: "Server" = Relationship(back_populates="subscriptions")
    plan: "Plan" = Relationship(back_populates="subscriptions")
    
    @property
    def remaining_traffic(self) -> int:
        """Calculate remaining traffic in GB"""
        return max(0, self.total_traffic - self.used_traffic)
    
    @property
    def is_expired(self) -> bool:
        """Check if subscription is expired"""
        return datetime.utcnow() > self.expire_date
    
    @property
    def is_traffic_finished(self) -> bool:
        """Check if traffic is finished"""
        return self.used_traffic >= self.total_traffic
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is active"""
        return (
            self.status == "active"
            and not self.is_expired
            and not self.is_traffic_finished
        )

class SubscriptionCreate(SubscriptionBase):
    """Subscription creation schema"""
    pass

class SubscriptionUpdate(SQLModel):
    """Subscription update schema"""
    name: Optional[str] = None
    status: Optional[str] = None
    expire_date: Optional[datetime] = None
    total_traffic: Optional[int] = None
    used_traffic: Optional[int] = None
    upload: Optional[int] = None
    download: Optional[int] = None
    settings: Optional[dict] = None

class SubscriptionRead(SubscriptionBase):
    """Subscription read schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    remaining_traffic: int
    is_active: bool

# Prevent circular imports
from .user import User
from .server import Server, ServerRead
from .payment import Payment
