from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ...db.session import get_session
from ...db.models.user import User
from ...services.backup import backup_service
from ...services.activity_logger import ActivityLogger
from ..deps import get_current_active_superuser
from ...core.config import settings

router = APIRouter()

@router.post("/backups/create", response_model=Dict[str, Any])
async def create_backup(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Create a new system backup.
    Only accessible by superadmin.
    """
    try:
        # Check if another backup is in progress
        recent_backup = db.query(BackupMetadata).filter(
            BackupMetadata.status == "in_progress",
            BackupMetadata.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).first()
        
        if recent_backup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another backup is currently in progress"
            )
        
        # Create backup in background
        background_tasks.add_task(
            backup_service.create_backup,
            db=db,
            user=current_user
        )
        
        # Log activity
        await ActivityLogger.log_activity(
            activity_type="backup_initiated",
            user_id=current_user.id,
            details={"initiated_at": datetime.utcnow().isoformat()}
        )
        
        return {
            "status": "initiated",
            "message": "Backup creation started in background"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/backups/{backup_path}/restore", response_model=Dict[str, Any])
async def restore_backup(
    *,
    backup_path: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Restore system from a backup.
    Only accessible by superadmin.
    """
    try:
        # Validate backup exists
        backup = db.query(BackupMetadata).filter_by(backup_path=backup_path).first()
        if not backup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup not found"
            )
        
        # Check if restore is already in progress
        recent_restore = db.query(BackupMetadata).filter(
            BackupMetadata.status == "restoring",
            BackupMetadata.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).first()
        
        if recent_restore:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another restore operation is in progress"
            )
        
        # Start restore in background
        background_tasks.add_task(
            backup_service.restore_backup,
            backup_path=backup_path,
            db=db
        )
        
        # Log activity
        await ActivityLogger.log_activity(
            activity_type="backup_restore_initiated",
            user_id=current_user.id,
            details={
                "backup_path": backup_path,
                "initiated_at": datetime.utcnow().isoformat()
            }
        )
        
        return {
            "status": "initiated",
            "message": "System restore started in background"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/backups", response_model=List[Dict[str, Any]])
async def list_backups(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    List all available backups.
    Only accessible by superadmin.
    """
    try:
        backups = await backup_service.list_backups(db)
        
        # Log activity
        await ActivityLogger.log_activity(
            activity_type="backup_list_viewed",
            user_id=current_user.id
        )
        
        return backups
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/backups/{backup_path}", response_model=Dict[str, Any])
async def delete_backup(
    *,
    backup_path: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete a backup.
    Only accessible by superadmin.
    """
    try:
        # Validate backup exists
        backup = db.query(BackupMetadata).filter_by(backup_path=backup_path).first()
        if not backup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup not found"
            )
        
        # Check if backup is in use
        if backup.status in ["restoring", "in_progress"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete backup while it is in use"
            )
        
        result = await backup_service.delete_backup(backup_path, db)
        
        # Log activity
        await ActivityLogger.log_activity(
            activity_type="backup_deleted",
            user_id=current_user.id,
            details={"backup_path": backup_path}
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/backups/status", response_model=Dict[str, Any])
async def get_backup_status(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Get backup system status.
    Only accessible by superadmin.
    """
    try:
        # Get recent backups
        recent_backups = db.query(BackupMetadata).filter(
            BackupMetadata.timestamp >= datetime.utcnow() - timedelta(days=7)
        ).all()
        
        # Calculate statistics
        total_size = sum(b.size_bytes for b in recent_backups)
        successful = len([b for b in recent_backups if b.status == "success"])
        failed = len([b for b in recent_backups if b.status == "failed"])
        
        return {
            "backup_enabled": settings.BACKUP_SCHEDULE_ENABLED,
            "schedule": settings.BACKUP_SCHEDULE_CRON,
            "recent_stats": {
                "total_backups": len(recent_backups),
                "successful": successful,
                "failed": failed,
                "total_size": total_size,
                "period_days": 7
            },
            "settings": {
                "retention_days": settings.BACKUP_RETENTION_DAYS,
                "compression_level": settings.BACKUP_COMPRESSION_LEVEL,
                "encryption_enabled": bool(settings.BACKUP_ENCRYPTION_KEY),
                "max_size": settings.MAX_BACKUP_SIZE
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
