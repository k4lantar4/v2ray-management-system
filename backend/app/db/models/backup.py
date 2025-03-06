from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from .base import TimestampModel
from .user import User

class BackupMetadata(TimestampModel, table=True):
    """Model for storing backup metadata"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    backup_path: str = Field(..., description="Path to the backup files")
    timestamp: datetime = Field(..., description="When the backup was created")
    version: str = Field(..., description="System version when backup was created")
    size_bytes: int = Field(..., description="Total size of backup in bytes")
    status: str = Field(..., description="Status of the backup (success/failed)")
    database_tables: List[str] = Field(..., description="List of tables included in backup")
    config_files: List[str] = Field(..., description="List of config files included in backup")
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    error_message: Optional[str] = Field(default=None, description="Error message if backup failed")
    is_encrypted: bool = Field(default=False, description="Whether the backup is encrypted")
    compression_level: int = Field(..., description="Compression level used (1-9)")

    # Relationships
    creator: Optional[User] = Relationship(
        back_populates="created_backups",
        sa_relationship_kwargs={
            "lazy": "joined"
        }
    )

    class Config:
        arbitrary_types_allowed = True

    @property
    def size_formatted(self) -> str:
        """Return human readable size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.size_bytes < 1024:
                return f"{self.size_bytes:.1f} {unit}"
            self.size_bytes /= 1024
        return f"{self.size_bytes:.1f} TB"

    @property
    def is_recent(self) -> bool:
        """Check if backup is from last 24 hours"""
        return (datetime.utcnow() - self.timestamp).days < 1

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "backup_path": self.backup_path,
            "timestamp": self.timestamp.isoformat(),
            "version": self.version,
            "size": self.size_formatted,
            "size_bytes": self.size_bytes,
            "status": self.status,
            "database_tables": self.database_tables,
            "config_files": self.config_files,
            "created_by": self.created_by,
            "creator_name": self.creator.full_name if self.creator else None,
            "error_message": self.error_message,
            "is_encrypted": self.is_encrypted,
            "compression_level": self.compression_level,
            "is_recent": self.is_recent,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
