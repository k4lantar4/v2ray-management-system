from typing import Optional, List, ForwardRef
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from .base import BaseModel

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    PENDING = "pending"

class SubscriptionBase(SQLModel):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    server_id: Optional[int] = Field(default=None, foreign_key="server.id")
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    data_limit: int  # in GB
    data_used: int = Field(default=0)  # in GB
    status: SubscriptionStatus = Field(default=SubscriptionStatus.PENDING)
    auto_renew: bool = Field(default=False)
    price: float
    config_data: Optional[str] = Field(default=None)  # VPN configuration data
    xui_uuid: Optional[str] = Field(default=None, unique=True)  # 3x-ui UUID

class Subscription(BaseModel, SubscriptionBase, table=True):
    """Subscription model with relationships"""
    user: "User" = Relationship(back_populates="subscriptions")
    server: "Server" = Relationship(back_populates="subscriptions")
    payments: List["Payment"] = Relationship(back_populates="subscription")

    class Config:
        arbitrary_types_allowed = True

class SubscriptionCreate(SQLModel):
    """Schema for subscription creation"""
    server_id: int
    duration_months: int  # Will be used to calculate end_date
    data_limit: int
    auto_renew: Optional[bool] = False
    price: float

class SubscriptionUpdate(SQLModel):
    """Schema for subscription update"""
    end_date: Optional[datetime] = None
    data_limit: Optional[int] = None
    status: Optional[SubscriptionStatus] = None
    auto_renew: Optional[bool] = None
    data_used: Optional[int] = None
    config_data: Optional[str] = None

class SubscriptionRead(SubscriptionBase):
    """Schema for reading subscription data"""
    id: int
    created_at: datetime
    server: "ServerRead"

    class Config:
        orm_mode = True

# Prevent circular imports
from .user import User
from .server import Server, ServerRead
from .payment import Payment
