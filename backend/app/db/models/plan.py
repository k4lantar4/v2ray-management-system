"""
Plan model for subscription plans
"""

from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import TimestampModel

class PlanBase(SQLModel):
    """Base Plan model"""
    name: str = Field(unique=True, index=True)
    description: Optional[str] = Field(default=None)
    price: float = Field(gt=0)
    duration: int = Field(gt=0)  # In days
    traffic: int = Field(gt=0)  # In GB
    is_active: bool = Field(default=True)
    max_users: Optional[int] = Field(default=None)
    features: dict = Field(default_factory=dict)
    sort_order: int = Field(default=0)

class Plan(PlanBase, TimestampModel, table=True):
    """Plan model with relationships"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    subscriptions: List["Subscription"] = Relationship(back_populates="plan")
    
    @property
    def is_available(self) -> bool:
        """Check if plan is available for purchase"""
        if not self.is_active:
            return False
        if self.max_users is None:
            return True
        return len(self.subscriptions) < self.max_users

class PlanCreate(PlanBase):
    """Plan creation schema"""
    pass

class PlanUpdate(SQLModel):
    """Plan update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    traffic: Optional[int] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None
    features: Optional[dict] = None
    sort_order: Optional[int] = None

class PlanRead(PlanBase):
    """Plan read schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    active_subscriptions: int = Field(default=0)
    is_available: bool 