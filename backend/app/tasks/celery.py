from celery import Celery
from celery.schedules import crontab
from sqlalchemy.orm import Session

from ..core.config import settings
from ..db.session import SessionLocal
from ..services.backup import backup_service
from ..services.activity_logger import ActivityLogger

celery_app = Celery(
    "tasks",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Configure periodic tasks
if settings.BACKUP_SCHEDULE_ENABLED:
    celery_app.conf.beat_schedule = {
        "automated-backup": {
            "task": "app.tasks.celery.create_automated_backup",
            "schedule": crontab.from_string(settings.BACKUP_SCHEDULE_CRON),
        },
        "cleanup-old-backups": {
            "task": "app.tasks.celery.cleanup_old_backups",
            "schedule": crontab(hour=1, minute=0),  # Run daily at 1 AM
        }
    }

@celery_app.task(bind=True, max_retries=3)
async def create_automated_backup(self):
    """Create automated system backup"""
    try:
        db = SessionLocal()
        try:
            # Create backup
            result = await backup_service.create_backup(db)
            
            # Log success
            await ActivityLogger.log_activity(
                activity_type="automated_backup_created",
                details={
                    "backup_path": result["backup_path"],
                    "size": result["size_bytes"],
                    "tables": result["database_tables"]
                }
            )
            
            return result
            
        except Exception as e:
            # Log failure
            await ActivityLogger.log_activity(
                activity_type="automated_backup_failed",
                details={"error": str(e)}
            )
            raise
            
        finally:
            db.close()
            
    except Exception as e:
        # Retry on failure
        self.retry(exc=e, countdown=60 * 5)  # Retry after 5 minutes

@celery_app.task(bind=True)
async def cleanup_old_backups(self):
    """Clean up old backups based on retention policy"""
    try:
        db = SessionLocal()
        try:
            # Get all backups
            backups = await backup_service.list_backups(db)
            
            # Calculate retention date
            retention_days = settings.BACKUP_RETENTION_DAYS
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            deleted_count = 0
            for backup in backups:
                backup_date = datetime.strptime(backup["timestamp"], "%Y-%m-%dT%H:%M:%S.%f")
                if backup_date < cutoff_date:
                    await backup_service.delete_backup(backup["backup_path"], db)
                    deleted_count += 1
            
            # Log cleanup results
            await ActivityLogger.log_activity(
                activity_type="backup_cleanup_completed",
                details={
                    "deleted_count": deleted_count,
                    "retention_days": retention_days
                }
            )
            
            return {
                "status": "success",
                "deleted_count": deleted_count
            }
            
        finally:
            db.close()
            
    except Exception as e:
        # Log failure
        await ActivityLogger.log_activity(
            activity_type="backup_cleanup_failed",
            details={"error": str(e)}
        )
        raise

# Additional utility tasks

@celery_app.task(bind=True)
async def verify_backup_integrity(self, backup_path: str):
    """Verify the integrity of a backup file"""
    try:
        db = SessionLocal()
        try:
            # Get backup metadata
            backup = db.query(BackupMetadata).filter_by(backup_path=backup_path).first()
            if not backup:
                raise ValueError("Backup not found")
            
            # Check file exists
            if not Path(backup_path).exists():
                raise ValueError("Backup file missing")
            
            # Check file size
            actual_size = Path(backup_path).stat().st_size
            if actual_size != backup.size_bytes:
                raise ValueError("Backup file size mismatch")
            
            # Try to decrypt if encrypted
            if backup.is_encrypted:
                try:
                    with open(backup_path, 'rb') as f:
                        encrypted_data = f.read()
                    backup_service._fernet.decrypt(encrypted_data)
                except Exception:
                    raise ValueError("Backup decryption failed")
            
            # Log verification success
            await ActivityLogger.log_activity(
                activity_type="backup_verified",
                details={"backup_path": backup_path}
            )
            
            return {
                "status": "success",
                "message": "Backup integrity verified"
            }
            
        finally:
            db.close()
            
    except Exception as e:
        # Log verification failure
        await ActivityLogger.log_activity(
            activity_type="backup_verification_failed",
            details={
                "backup_path": backup_path,
                "error": str(e)
            }
        )
        raise

@celery_app.task(bind=True)
async def rotate_backups(self, max_backups: int = 10):
    """Rotate backups keeping only the specified number of most recent backups"""
    try:
        db = SessionLocal()
        try:
            # Get all backups ordered by timestamp
            backups = await backup_service.list_backups(db)
            backups.sort(key=lambda x: x["timestamp"], reverse=True)
            
            # Delete excess backups
            deleted_count = 0
            for backup in backups[max_backups:]:
                await backup_service.delete_backup(backup["backup_path"], db)
                deleted_count += 1
            
            # Log rotation results
            await ActivityLogger.log_activity(
                activity_type="backup_rotation_completed",
                details={
                    "kept_count": min(len(backups), max_backups),
                    "deleted_count": deleted_count
                }
            )
            
            return {
                "status": "success",
                "kept_count": min(len(backups), max_backups),
                "deleted_count": deleted_count
            }
            
        finally:
            db.close()
            
    except Exception as e:
        # Log rotation failure
        await ActivityLogger.log_activity(
            activity_type="backup_rotation_failed",
            details={"error": str(e)}
        )
        raise
