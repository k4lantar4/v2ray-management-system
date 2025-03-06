from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from datetime import datetime

from ...db.session import get_session
from ...db.models.payment import (
    Payment,
    PaymentCreate,
    PaymentUpdate,
    PaymentRead,
    PaymentStatus,
    PaymentMethod,
    PaymentType
)
from ...db.models.user import User, UserRole
from ...db.models.discount import Discount
from ..deps import get_current_active_user, get_current_active_staff

router = APIRouter()

@router.get("/", response_model=List[PaymentRead])
async def list_payments(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    status: Optional[PaymentStatus] = None,
    payment_type: Optional[PaymentType] = None
) -> Any:
    """
    Retrieve payments.
    Regular users can only see their own payments.
    Staff can see all payments.
    """
    query = select(Payment)
    
    # Regular users can only see their own payments
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        query = query.where(Payment.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.where(Payment.status == status)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    
    # Apply pagination
    payments = db.exec(query.offset(skip).limit(limit)).all()
    return payments

@router.post("/", response_model=PaymentRead)
async def create_payment(
    *,
    db: Session = Depends(get_session),
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new payment.
    """
    # Calculate final amount with discount if provided
    final_amount = payment_in.amount
    if payment_in.discount_code:
        discount = db.exec(
            select(Discount).where(Discount.code == payment_in.discount_code)
        ).first()
        if not discount or not discount.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid discount code"
            )
        
        if not discount.can_apply_to_amount(payment_in.amount):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount cannot be applied to this amount"
            )
        
        discount_amount = discount.calculate_discount(payment_in.amount)
        final_amount = payment_in.amount - discount_amount
        discount.use_discount()
        db.add(discount)
    
    # Create payment
    payment = Payment(
        user_id=current_user.id,
        subscription_id=payment_in.subscription_id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        payment_type=payment_in.payment_type,
        description=payment_in.description,
        discount_code=payment_in.discount_code,
        discount_amount=payment_in.amount - final_amount if payment_in.discount_code else 0,
        final_amount=final_amount
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment

@router.get("/{payment_id}", response_model=PaymentRead)
async def get_payment(
    *,
    db: Session = Depends(get_session),
    payment_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get payment by ID.
    Regular users can only access their own payments.
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if (current_user.id != payment.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return payment

@router.post("/{payment_id}/upload-receipt")
async def upload_receipt(
    *,
    db: Session = Depends(get_session),
    payment_id: int,
    receipt: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Upload payment receipt.
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.id != payment.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Validate receipt file
    if not receipt.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Save receipt file
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filename = f"receipt_{payment.id}_{timestamp}.{receipt.filename.split('.')[-1]}"
    filepath = f"uploads/receipts/{filename}"
    
    # TODO: Implement file storage (local/S3/etc.)
    # with open(filepath, "wb") as buffer:
    #     buffer.write(await receipt.read())
    
    # Update payment
    payment.receipt_image = filepath
    payment.status = PaymentStatus.PENDING
    db.add(payment)
    db.commit()
    
    return {"msg": "Receipt uploaded successfully"}

@router.post("/{payment_id}/verify")
async def verify_payment(
    *,
    db: Session = Depends(get_session),
    payment_id: int,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Verify payment and mark as completed.
    Only accessible by admin and support staff.
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is {payment.status}, not pending"
        )
    
    # Update payment status
    payment.status = PaymentStatus.COMPLETED
    
    # Update user wallet if payment type is wallet charge
    if payment.payment_type == PaymentType.WALLET_CHARGE:
        user = db.get(User, payment.user_id)
        user.wallet_balance += payment.final_amount
        db.add(user)
    
    # Update subscription if payment type is subscription
    elif payment.payment_type == PaymentType.SUBSCRIPTION and payment.subscription:
        subscription = payment.subscription
        if subscription.status == "pending":
            subscription.status = "active"
        elif subscription.status == "active":
            # Extend subscription period
            subscription.end_date += timedelta(days=30)  # Assuming monthly subscription
        db.add(subscription)
    
    db.add(payment)
    db.commit()
    
    return {"msg": "Payment verified successfully"}

@router.post("/{payment_id}/reject")
async def reject_payment(
    *,
    db: Session = Depends(get_session),
    payment_id: int,
    reason: str,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Reject payment.
    Only accessible by admin and support staff.
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is {payment.status}, not pending"
        )
    
    payment.status = PaymentStatus.FAILED
    payment.description = f"Rejected: {reason}"
    db.add(payment)
    db.commit()
    
    return {"msg": "Payment rejected successfully"}

@router.post("/{payment_id}/refund")
async def refund_payment(
    *,
    db: Session = Depends(get_session),
    payment_id: int,
    reason: str,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Refund payment.
    Only accessible by admin.
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed payments can be refunded"
        )
    
    # Create refund payment
    refund = Payment(
        user_id=payment.user_id,
        subscription_id=payment.subscription_id,
        amount=payment.final_amount,
        payment_type=PaymentType.REFUND,
        status=PaymentStatus.COMPLETED,
        description=f"Refund for payment #{payment.id}: {reason}",
        final_amount=payment.final_amount
    )
    
    # Update original payment
    payment.status = PaymentStatus.REFUNDED
    payment.description = f"Refunded: {reason}"
    
    db.add(refund)
    db.add(payment)
    db.commit()
    
    return {"msg": "Payment refunded successfully"}

from ..deps import get_current_active_superuser

@router.get("/stats")
async def get_payment_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Any:
    """
    Get payment statistics.
    Only accessible by admin.
    """
    query = select(Payment)
    
    # Apply date filters
    if start_date:
        query = query.where(Payment.created_at >= start_date)
    if end_date:
        query = query.where(Payment.created_at <= end_date)
    
    payments = db.exec(query).all()
    
    # Calculate statistics
    total_revenue = sum(p.final_amount for p in payments if p.status == PaymentStatus.COMPLETED)
    total_refunds = sum(p.final_amount for p in payments if p.payment_type == PaymentType.REFUND)
    pending_payments = sum(1 for p in payments if p.status == PaymentStatus.PENDING)
    
    return {
        "total_revenue": total_revenue,
        "total_refunds": total_refunds,
        "pending_payments": pending_payments,
        "payment_count": len(payments)
    }
