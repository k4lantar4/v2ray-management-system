from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from .base import BaseModel

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CARD = "card"  # Card to Card
    WALLET = "wallet"  # Internal wallet
    CRYPTO = "crypto"  # Cryptocurrency

class PaymentType(str, Enum):
    SUBSCRIPTION = "subscription"
    WALLET_CHARGE = "wallet_charge"
    REFUND = "refund"

class PaymentBase(SQLModel):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    subscription_id: Optional[int] = Field(default=None, foreign_key="subscription.id")
    amount: float
    payment_method: PaymentMethod
    payment_type: PaymentType
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    transaction_id: Optional[str] = Field(default=None, unique=True)
    receipt_image: Optional[str] = Field(default=None)  # Path to uploaded receipt image
    description: Optional[str] = Field(default=None)
    discount_code: Optional[str] = Field(default=None)
    discount_amount: float = Field(default=0.0)
    final_amount: float  # Amount after discount

class Payment(BaseModel, PaymentBase, table=True):
    """Payment model with relationships"""
    user: "User" = Relationship(back_populates="payments")
    subscription: Optional["Subscription"] = Relationship(back_populates="payments")

    def apply_discount(self, discount: "Discount") -> bool:
        """Apply discount to payment"""
        if not discount or not discount.is_valid:
            return False
        
        self.discount_code = discount.code
        self.discount_amount = (
            discount.amount if discount.is_fixed 
            else self.amount * (discount.amount / 100)
        )
        self.final_amount = max(0, self.amount - self.discount_amount)
        return True

    def mark_as_completed(self, transaction_id: str):
        """Mark payment as completed"""
        self.status = PaymentStatus.COMPLETED
        self.transaction_id = transaction_id

    def mark_as_failed(self, reason: str = None):
        """Mark payment as failed"""
        self.status = PaymentStatus.FAILED
        if reason:
            self.description = f"Failed: {reason}"

class PaymentCreate(SQLModel):
    """Schema for payment creation"""
    subscription_id: Optional[int] = None
    amount: float
    payment_method: PaymentMethod
    payment_type: PaymentType
    discount_code: Optional[str] = None
    description: Optional[str] = None

class PaymentUpdate(SQLModel):
    """Schema for payment update"""
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    receipt_image: Optional[str] = None
    description: Optional[str] = None

class PaymentRead(PaymentBase):
    """Schema for reading payment data"""
    id: int
    user: "UserRead"
    subscription: Optional["SubscriptionRead"] = None

    class Config:
        orm_mode = True

# Prevent circular imports
from .user import User, UserRead
from .subscription import Subscription, SubscriptionRead
from .discount import Discount
