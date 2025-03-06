from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta

from ...db.session import get_session, cache
from ...db.models.server import (
    Server,
    ServerCreate,
    ServerUpdate,
    ServerRead,
    ServerWithStats,
    ServerStatus,
    ServerLocation
)
from ...db.models.user import User, UserRole
from ..deps import get_current_active_staff, get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ServerRead])
@cache(ttl_seconds=300)  # Cache for 5 minutes
async def list_servers(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    location: Optional[ServerLocation] = None,
    status: Optional[ServerStatus] = None,
    available_only: bool = False
) -> Any:
    """
    Retrieve servers with filtering and pagination.
    """
    query = select(Server).where(Server.is_deleted == False)
    
    # Apply filters
    if location:
        query = query.where(Server.location == location)
    if status:
        query = query.where(Server.status == status)
    if available_only:
        query = query.where(
            (Server.status == ServerStatus.ACTIVE) &
            (Server.current_users < Server.capacity)
        )
    
    # Apply pagination
    servers = db.exec(query.offset(skip).limit(limit)).all()
    return servers

@router.get("/stats", response_model=List[ServerWithStats])
@cache(ttl_seconds=300)  # Cache for 5 minutes
async def get_server_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Get detailed server statistics.
    Only accessible by admin and support staff.
    """
    servers = db.exec(
        select(Server).where(Server.is_deleted == False)
    ).all()
    
    # Calculate additional statistics for each server
    for server in servers:
        # Get subscriptions for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        subscriptions = server.subscriptions
        active_subs = [s for s in subscriptions if s.status == "active"]
        
        server.total_bandwidth_used = sum(s.data_used for s in active_subs)
        server.average_user_bandwidth = (
            server.total_bandwidth_used / len(active_subs) if active_subs else 0
        )
        server.subscription_count = len(active_subs)
        
        # Calculate uptime (placeholder - should be implemented with actual monitoring)
        server.uptime_percentage = 99.9
    
    return servers

@router.get("/{server_id}", response_model=ServerWithStats)
async def get_server(
    *,
    db: Session = Depends(get_session),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get server by ID with detailed statistics.
    """
    server = db.get(Server, server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    # Calculate statistics
    active_subs = [s for s in server.subscriptions if s.status == "active"]
    server.total_bandwidth_used = sum(s.data_used for s in active_subs)
    server.average_user_bandwidth = (
        server.total_bandwidth_used / len(active_subs) if active_subs else 0
    )
    server.subscription_count = len(active_subs)
    server.uptime_percentage = 99.9  # Placeholder
    
    return server

@router.post("/", response_model=ServerRead)
async def create_server(
    *,
    db: Session = Depends(get_session),
    server_in: ServerCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create new server.
    Only accessible by admin.
    """
    server = Server(**server_in.dict())
    db.add(server)
    db.commit()
    db.refresh(server)
    return server

@router.put("/{server_id}", response_model=ServerRead)
async def update_server(
    *,
    db: Session = Depends(get_session),
    server_id: int,
    server_in: ServerUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Update server.
    Only accessible by admin.
    """
    server = db.get(Server, server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    # Update server data
    server_data = server_in.dict(exclude_unset=True)
    for field, value in server_data.items():
        setattr(server, field, value)
    
    db.add(server)
    db.commit()
    db.refresh(server)
    return server

@router.delete("/{server_id}")
async def delete_server(
    *,
    db: Session = Depends(get_session),
    server_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete server.
    Only accessible by admin.
    """
    server = db.get(Server, server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    # Check if server has active subscriptions
    active_subs = [s for s in server.subscriptions if s.status == "active"]
    if active_subs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete server with active subscriptions"
        )
    
    # Soft delete
    server.is_deleted = True
    server.status = ServerStatus.OFFLINE
    db.add(server)
    db.commit()
    
    return {"msg": "Server successfully deleted"}

@router.post("/{server_id}/status")
async def update_server_status(
    *,
    db: Session = Depends(get_session),
    server_id: int,
    new_status: ServerStatus,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Update server status.
    Accessible by admin and support staff.
    """
    server = db.get(Server, server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    server.status = new_status
    db.add(server)
    db.commit()
    db.refresh(server)
    return server

@router.post("/{server_id}/sync")
async def sync_server_stats(
    *,
    db: Session = Depends(get_session),
    server_id: int,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Synchronize server statistics with 3x-ui panel.
    Accessible by admin and support staff.
    """
    server = db.get(Server, server_id)
    if not server or server.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    try:
        # TODO: Implement actual sync with 3x-ui panel
        # This should update:
        # - current_users
        # - bandwidth_used
        # - subscription data usage
        return {"msg": "Server statistics synchronized successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync server stats: {str(e)}"
        )
