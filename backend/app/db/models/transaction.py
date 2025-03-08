"""
Transaction model for payment transactions
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from .base import TimestampModel

class TransactionType(str):
    """Transaction types"""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    PURCHASE = "purchase"
    REFUND = "refund"

class TransactionStatus(str):
    """Transaction statuses"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TransactionBase(SQLModel):
    """Base Transaction model"""
    user_id: int = Field(foreign_key="user.id")
    type: str = Field(index=True)  # TransactionType
    status: str = Field(default=TransactionStatus.PENDING)  # TransactionStatus
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None)
    reference_id: Optional[str] = Field(default=None, index=True)
    metadata: dict = Field(default_factory=dict)

class Transaction(TransactionBase, TimestampModel, table=True):
    """Transaction model with relationships"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    user: "User" = Relationship(back_populates="transactions")
    
    @property
    def is_completed(self) -> bool:
        """Check if transaction is completed"""
        return self.status == TransactionStatus.COMPLETED
    
    @property
    def is_credit(self) -> bool:
        """Check if transaction adds credit"""
        return self.type in [TransactionType.DEPOSIT, TransactionType.REFUND]
    
    @property
    def is_debit(self) -> bool:
        """Check if transaction removes credit"""
        return self.type in [TransactionType.WITHDRAWAL, TransactionType.PURCHASE]

class TransactionCreate(TransactionBase):
    """Transaction creation schema"""
    pass

class TransactionUpdate(SQLModel):
    """Transaction update schema"""
    status: Optional[str] = None
    description: Optional[str] = None
    reference_id: Optional[str] = None
    metadata: Optional[dict] = None

class TransactionRead(TransactionBase):
    """Transaction read schema"""
    id: int
    created_at: datetime
    updated_at: datetime 