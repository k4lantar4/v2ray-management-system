from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...db.session import get_session
from ...db.models.discount import (
    Discount,
    DiscountCreate,
    DiscountUpdate,
    DiscountRead,
    DiscountType,
    DiscountStatus
)
from ...db.models.user import User, UserRole
from ..deps import get_current_active_user, get_current_active_staff, get_current_active_superuser

router = APIRouter()

@router.get("/", response_model=List[DiscountRead])
async def list_discounts(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff),
    skip: int = 0,
    limit: int = 100,
    status: Optional[DiscountStatus] = None,
    type: Optional[DiscountType] = None,
    active_only: bool = False
) -> Any:
    """
    Retrieve discounts with filtering and pagination.
    Only accessible by admin and support staff.
    """
    query = select(Discount)
    
    # Apply filters
    if status:
        query = query.where(Discount.status == status)
    if type:
        query = query.where(Discount.type == type)
    if active_only:
        query = query.where(Discount.status == DiscountStatus.ACTIVE)
    
    # Apply pagination
    discounts = db.exec(query.offset(skip).limit(limit)).all()
    return discounts

@router.post("/", response_model=DiscountRead)
async def create_discount(
    *,
    db: Session = Depends(get_session),
    discount_in: DiscountCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create new discount.
    Only accessible by admin.
    """
    # Check if code already exists
    existing_discount = db.exec(
        select(Discount).where(Discount.code == discount_in.code)
    ).first()
    if existing_discount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount code already exists"
        )
    
    # Validate discount amount
    if discount_in.type == DiscountType.PERCENTAGE and discount_in.amount > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Percentage discount cannot exceed 100%"
        )
    
    # Create discount
    discount = Discount(**discount_in.dict())
    db.add(discount)
    db.commit()
    db.refresh(discount)
    
    return discount

@router.get("/{discount_id}", response_model=DiscountRead)
async def get_discount(
    *,
    db: Session = Depends(get_session),
    discount_id: int,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Get discount by ID.
    Only accessible by admin and support staff.
    """
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    return discount

@router.put("/{discount_id}", response_model=DiscountRead)
async def update_discount(
    *,
    db: Session = Depends(get_session),
    discount_id: int,
    discount_in: DiscountUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Update discount.
    Only accessible by admin.
    """
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    
    # Update discount data
    discount_data = discount_in.dict(exclude_unset=True)
    for field, value in discount_data.items():
        setattr(discount, field, value)
    
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount

@router.delete("/{discount_id}")
async def delete_discount(
    *,
    db: Session = Depends(get_session),
    discount_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete discount.
    Only accessible by admin.
    """
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    
    # Soft delete
    discount.is_deleted = True
    discount.status = DiscountStatus.DISABLED
    db.add(discount)
    db.commit()
    
    return {"msg": "Discount successfully deleted"}

@router.post("/{discount_id}/activate")
async def activate_discount(
    *,
    db: Session = Depends(get_session),
    discount_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Activate disabled discount.
    Only accessible by admin.
    """
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    
    if discount.status != DiscountStatus.DISABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discount is {discount.status}, not disabled"
        )
    
    discount.status = DiscountStatus.ACTIVE
    db.add(discount)
    db.commit()
    db.refresh(discount)
    
    return discount

@router.post("/{discount_id}/deactivate")
async def deactivate_discount(
    *,
    db: Session = Depends(get_session),
    discount_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Deactivate active discount.
    Only accessible by admin.
    """
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    
    if discount.status != DiscountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discount is {discount.status}, not active"
        )
    
    discount.status = DiscountStatus.DISABLED
    db.add(discount)
    db.commit()
    db.refresh(discount)
    
    return discount

@router.get("/verify/{code}")
async def verify_discount(
    *,
    db: Session = Depends(get_session),
    code: str,
    amount: float,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Verify discount code and calculate discount amount.
    """
    discount = db.exec(
        select(Discount).where(Discount.code == code)
    ).first()
    
    if not discount or not discount.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid discount code"
        )
    
    if not discount.can_apply_to_amount(amount):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be applied to this amount"
        )
    
    # Check if discount is user-specific
    if discount.user_specific and discount.specific_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This discount code is not valid for your account"
        )
    
    discount_amount = discount.calculate_discount(amount)
    final_amount = amount - discount_amount
    
    return {
        "discount_code": code,
        "original_amount": amount,
        "discount_amount": discount_amount,
        "final_amount": final_amount,
        "discount_type": discount.type,
        "discount_percentage": discount.amount if discount.type == DiscountType.PERCENTAGE else None
    }

@router.get("/stats")
async def get_discount_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Get discount usage statistics.
    Only accessible by admin and support staff.
    """
    discounts = db.exec(select(Discount)).all()
    
    total_discounts = len(discounts)
    active_discounts = sum(1 for d in discounts if d.status == DiscountStatus.ACTIVE)
    total_uses = sum(d.current_uses for d in discounts)
    
    # Calculate total discount amount given
    from ...db.models.payment import Payment
    payments = db.exec(select(Payment)).all()
    total_discount_amount = sum(p.discount_amount for p in payments if p.discount_amount > 0)
    
    return {
        "total_discounts": total_discounts,
        "active_discounts": active_discounts,
        "total_uses": total_uses,
        "total_discount_amount": total_discount_amount
    }
