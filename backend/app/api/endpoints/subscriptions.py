from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta

from ...db.session import get_session
from ...db.models.subscription import (
    Subscription,
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionRead,
    SubscriptionStatus
)
from ...db.models.user import User, UserRole
from ...db.models.server import Server, ServerStatus
from ...db.models.payment import Payment, PaymentStatus, PaymentType
from ..deps import get_current_active_user, get_current_active_staff

router = APIRouter()

@router.get("/", response_model=List[SubscriptionRead])
async def list_subscriptions(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    status: Optional[SubscriptionStatus] = None
) -> Any:
    """
    Retrieve subscriptions.
    Regular users can only see their own subscriptions.
    Staff can see all subscriptions.
    """
    query = select(Subscription)
    
    # Regular users can only see their own subscriptions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        query = query.where(Subscription.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.where(Subscription.status == status)
    
    # Apply pagination
    subscriptions = db.exec(query.offset(skip).limit(limit)).all()
    return subscriptions

@router.post("/", response_model=SubscriptionRead)
async def create_subscription(
    *,
    db: Session = Depends(get_session),
    subscription_in: SubscriptionCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new subscription.
    """
    # Verify server exists and is available
    server = db.get(Server, subscription_in.server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    if not server.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Server is not available"
        )
    
    # Calculate end date
    end_date = datetime.utcnow() + timedelta(days=30 * subscription_in.duration_months)
    
    # Create subscription
    subscription = Subscription(
        user_id=current_user.id,
        server_id=subscription_in.server_id,
        end_date=end_date,
        data_limit=subscription_in.data_limit,
        auto_renew=subscription_in.auto_renew,
        price=subscription_in.price,
        status=SubscriptionStatus.PENDING
    )
    
    # Create pending payment
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=subscription_in.price,
        payment_type=PaymentType.SUBSCRIPTION,
        status=PaymentStatus.PENDING,
        final_amount=subscription_in.price
    )
    
    db.add(subscription)
    db.add(payment)
    db.commit()
    db.refresh(subscription)
    
    return subscription

@router.get("/{subscription_id}", response_model=SubscriptionRead)
async def get_subscription(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get subscription by ID.
    Regular users can only access their own subscriptions.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Check permissions
    if (current_user.id != subscription.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return subscription

@router.put("/{subscription_id}", response_model=SubscriptionRead)
async def update_subscription(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    subscription_in: SubscriptionUpdate,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Update subscription.
    Only accessible by admin and support staff.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Update subscription data
    subscription_data = subscription_in.dict(exclude_unset=True)
    for field, value in subscription_data.items():
        setattr(subscription, field, value)
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/{subscription_id}/renew")
async def renew_subscription(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    duration_months: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Renew subscription.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Check permissions
    if (current_user.id != subscription.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Calculate new end date and price
    new_end_date = subscription.end_date + timedelta(days=30 * duration_months)
    renewal_price = subscription.price * duration_months
    
    # Create pending payment
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=renewal_price,
        payment_type=PaymentType.SUBSCRIPTION,
        status=PaymentStatus.PENDING,
        final_amount=renewal_price
    )
    
    db.add(payment)
    db.commit()
    
    return {"msg": "Renewal payment created", "payment_id": payment.id}

@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Cancel subscription auto-renewal.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Check permissions
    if (current_user.id != subscription.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    subscription.auto_renew = False
    db.add(subscription)
    db.commit()
    
    return {"msg": "Auto-renewal cancelled successfully"}

@router.post("/{subscription_id}/change-server")
async def change_subscription_server(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    new_server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Change subscription server.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Check permissions
    if (current_user.id != subscription.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verify new server exists and is available
    new_server = db.get(Server, new_server_id)
    if not new_server or new_server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    if not new_server.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Server is not available"
        )
    
    # Update server
    subscription.server_id = new_server_id
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    # TODO: Update VPN configuration in 3x-ui panel
    
    return subscription

@router.get("/{subscription_id}/usage")
async def get_subscription_usage(
    *,
    db: Session = Depends(get_session),
    subscription_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get subscription usage statistics.
    """
    subscription = db.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Check permissions
    if (current_user.id != subscription.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Calculate usage statistics
    days_left = (subscription.end_date - datetime.utcnow()).days
    data_used_percentage = (subscription.data_used / subscription.data_limit) * 100
    
    return {
        "data_used": subscription.data_used,
        "data_limit": subscription.data_limit,
        "data_used_percentage": data_used_percentage,
        "days_left": days_left,
        "status": subscription.status
    }
