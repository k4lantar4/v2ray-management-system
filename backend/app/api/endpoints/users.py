from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from datetime import datetime

from ...db.session import get_session
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

@router.get("/stats")
async def get_user_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Get user statistics.
    Only accessible by admin and support staff.
    """
    total_users = db.exec(select(User)).count()
    active_users = db.exec(
        select(User).where(User.status == UserStatus.ACTIVE)
    ).count()
    vip_users = db.exec(
        select(User).where(User.role == UserRole.VIP)
    ).count()
    
    # Get users registered in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users = db.exec(
        select(User).where(User.created_at >= thirty_days_ago)
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "vip_users": vip_users,
        "new_users_last_30_days": new_users
    }

@router.get("/{user_id}", response_model=UserWithSubscriptions)
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
    
    user.role = new_role
    db.add(user)
    db.commit()
    db.refresh(user)
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
    
    user.status = new_status
    if new_status == UserStatus.BLOCKED:
        user.is_active = False
    elif new_status == UserStatus.ACTIVE:
        user.is_active = True
    
    db.add(user)
    db.commit()
    db.refresh(user)
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
    
    return {"msg": "Password updated successfully"}

from datetime import timedelta

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
    
    return users
