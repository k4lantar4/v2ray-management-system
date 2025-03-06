from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from enum import Enum
from .base import BaseModel

class DiscountType(str, Enum):
    PERCENTAGE = "percentage"  # Percentage off total amount
    FIXED = "fixed"  # Fixed amount off
    VOLUME = "volume"  # Based on subscription volume/duration

class DiscountStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    DISABLED = "disabled"

class DiscountBase(SQLModel):
    code: str = Field(unique=True, index=True)
    type: DiscountType
    amount: float  # Percentage or fixed amount
    description: Optional[str] = Field(default=None)
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = Field(default=None)
    max_uses: Optional[int] = Field(default=None)
    current_uses: int = Field(default=0)
    min_purchase_amount: Optional[float] = Field(default=None)
    max_discount_amount: Optional[float] = Field(default=None)
    user_specific: Optional[bool] = Field(default=False)
    specific_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    status: DiscountStatus = Field(default=DiscountStatus.ACTIVE)

class Discount(BaseModel, DiscountBase, table=True):
    """Discount model"""
    
    @property
    def is_valid(self) -> bool:
        """Check if discount is valid for use"""
        now = datetime.utcnow()
        
        # Check basic validity conditions
        if self.status != DiscountStatus.ACTIVE:
            return False
        
        if self.end_date and now > self.end_date:
            self.status = DiscountStatus.EXPIRED
            return False
        
        if self.max_uses and self.current_uses >= self.max_uses:
            self.status = DiscountStatus.USED
            return False
        
        return True
    
    @property
    def is_fixed(self) -> bool:
        """Check if discount is fixed amount"""
        return self.type == DiscountType.FIXED
    
    def can_apply_to_amount(self, amount: float) -> bool:
        """Check if discount can be applied to given amount"""
        if not self.is_valid:
            return False
            
        if self.min_purchase_amount and amount < self.min_purchase_amount:
            return False
            
        return True
    
    def calculate_discount(self, amount: float) -> float:
        """Calculate discount amount"""
        if not self.can_apply_to_amount(amount):
            return 0.0
            
        if self.is_fixed:
            discount = min(self.amount, amount)
        else:
            discount = amount * (self.amount / 100)
            
        if self.max_discount_amount:
            discount = min(discount, self.max_discount_amount)
            
        return discount
    
    def use_discount(self):
        """Mark discount as used once"""
        self.current_uses += 1
        if self.max_uses and self.current_uses >= self.max_uses:
            self.status = DiscountStatus.USED

class DiscountCreate(SQLModel):
    """Schema for discount creation"""
    code: str
    type: DiscountType
    amount: float
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    max_uses: Optional[int] = None
    min_purchase_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    user_specific: Optional[bool] = False
    specific_user_id: Optional[int] = None

class DiscountUpdate(SQLModel):
    """Schema for discount update"""
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    max_uses: Optional[int] = None
    status: Optional[DiscountStatus] = None
    min_purchase_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None

class DiscountRead(DiscountBase):
    """Schema for reading discount data"""
    id: int
    is_valid: bool
    remaining_uses: Optional[int] = None

    class Config:
        orm_mode = True

    @property
    def remaining_uses(self) -> Optional[int]:
        if self.max_uses:
            return max(0, self.max_uses - self.current_uses)
        return None
