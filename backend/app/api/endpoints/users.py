from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlmodel import Session, select, func
from datetime import datetime, timedelta

from ...db.session import get_session
from ...services.activity_logger import ActivityLogger
from ...db.models.user import (
    User,
    UserUpdate,
    UserRead,
    UserWithSubscriptions,
    UserRole,
    UserStatus
)
from ...core.security import get_password_hash
from ..deps import (
    get_current_active_superuser,
    get_current_active_user,
    get_current_active_staff
)

router = APIRouter()

@router.get("/", response_model=List[UserRead])
async def list_users(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff),
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None
) -> Any:
    """
    Retrieve users with filtering and pagination.
    Only accessible by admin and support staff.
    """
    query = select(User)
    
    # Apply filters
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    if search:
        query = query.where(
            (User.phone.contains(search)) |
            (User.full_name.contains(search))
        )
    
    # Apply pagination
    users = db.exec(query.offset(skip).limit(limit)).all()
    return users

@router.get("/analytics")
async def get_user_analytics(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff),
    days: Optional[int] = Query(30, ge=1, le=365)
) -> Dict[str, Any]:
    """
    Get detailed user analytics.
    Only accessible by admin and support staff.
    """
    now = datetime.utcnow()
    period_start = now - timedelta(days=days)
    
    # Basic stats
    total_users = db.exec(select(User)).count()
    active_users = db.exec(select(User).where(User.status == UserStatus.ACTIVE)).count()
    vip_users = db.exec(select(User).where(User.role == UserRole.VIP)).count()
    new_users = db.exec(select(User).where(User.created_at >= period_start)).count()
    
    # User growth over time
    growth_query = select(
        func.date_trunc('day', User.created_at).label('date'),
        func.count(User.id).label('count')
    ).where(
        User.created_at >= period_start
    ).group_by(
        func.date_trunc('day', User.created_at)
    ).order_by(
        func.date_trunc('day', User.created_at)
    )
    
    growth_data = db.exec(growth_query).all()
    daily_growth = [{"date": row.date, "new_users": row.count} for row in growth_data]
    
    # Status distribution
    status_query = select(
        User.status,
        func.count(User.id).label('count')
    ).group_by(User.status)
    
    status_data = db.exec(status_query).all()
    status_distribution = {str(row.status): row.count for row in status_data}
    
    # Role distribution
    role_query = select(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role)
    
    role_data = db.exec(role_query).all()
    role_distribution = {str(row.role): row.count for row in role_data}
    
    # Get activity stats
    activity_stats = await ActivityLogger.get_activity_stats()
    
    return {
        "overview": {
            "total_users": total_users,
            "active_users": active_users,
            "vip_users": vip_users,
            "new_users": new_users,
            "period_days": days
        },
        "growth": {
            "daily_growth": daily_growth,
            "average_daily_growth": new_users / days if days > 0 else 0
        },
        "distribution": {
            "by_status": status_distribution,
            "by_role": role_distribution
        },
        "activity": activity_stats
    }

@router.get("/{user_id}", response_model=UserWithSubscriptions, response_model_exclude_none=True)
async def get_user(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get user by ID.
    Regular users can only access their own profile.
    """
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_profile_view",
        user_id=current_user.id,
        details={"viewed_user_id": user_id}
    )
    return user

@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update user.
    Regular users can only update their own profile.
    Admins can update any user.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Regular users can't change their role or status
    if current_user.role != UserRole.ADMIN:
        user_in.role = None
        user_in.status = None
    
    # Update user data
    user_data = user_in.dict(exclude_unset=True)
    for field, value in user_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_updated",
        user_id=current_user.id,
        details={
            "target_user_id": user_id,
            "updated_fields": list(user_data.keys())
        }
    )
    return user

@router.delete("/{user_id}")
async def delete_user(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete user.
    Only accessible by admin.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete
    user.is_deleted = True
    user.is_active = False
    user.status = UserStatus.BLOCKED
    db.add(user)
    db.commit()
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_deleted",
        user_id=current_user.id,
        details={"deleted_user_id": user_id}
    )
    return {"msg": "User successfully deleted"}

@router.post("/{user_id}/change-role")
async def change_user_role(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    new_role: UserRole,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Change user role.
    Only accessible by admin.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_role = user.role
    user.role = new_role
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_role_changed",
        user_id=current_user.id,
        details={
            "target_user_id": user_id,
            "old_role": str(old_role),
            "new_role": str(new_role)
        }
    )
    return user

@router.post("/{user_id}/change-status")
async def change_user_status(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    new_status: UserStatus,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Change user status.
    Accessible by admin and support staff.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_status = user.status
    user.status = new_status
    if new_status == UserStatus.BLOCKED:
        user.is_active = False
    elif new_status == UserStatus.ACTIVE:
        user.is_active = True
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_status_changed",
        user_id=current_user.id,
        details={
            "target_user_id": user_id,
            "old_status": str(old_status),
            "new_status": str(new_status)
        }
    )
    return user

@router.post("/{user_id}/change-password")
async def change_password(
    *,
    db: Session = Depends(get_session),
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Change user password.
    Users can only change their own password.
    Admins can change any user's password.
    """
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="password_changed",
        user_id=current_user.id,
        details={"target_user_id": user_id}
    )
    return {"msg": "Password updated successfully"}

@router.get("/search/")
async def search_users(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff),
    query: str = Query(..., min_length=1),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Search users by phone number or full name.
    Only accessible by admin and support staff.
    """
    users = db.exec(
        select(User)
        .where(
            (User.phone.contains(query)) |
            (User.full_name.contains(query))
        )
        .offset(skip)
        .limit(limit)
    ).all()
    
    # Log activity
    await ActivityLogger.log_activity(
        activity_type="user_search",
        user_id=current_user.id,
        details={"query": query}
    )
    return users
