import os
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from ..core.config import settings
from ..db.models.backup import BackupMetadata
from ..db.models.user import User

logger = logging.getLogger(__name__)

class BackupService:
    def __init__(self):
        self.backup_dir = Path(settings.BACKUP_DIR)
        self._fernet = None if not settings.BACKUP_ENCRYPTION_KEY else Fernet(settings.BACKUP_ENCRYPTION_KEY)
    
    async def create_backup(self, db: Session, user: Optional[User] = None) -> Dict[str, Any]:
        """Create a system backup"""
        try:
            # Ensure backup directory exists
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            os.chmod(self.backup_dir, 0o700)  # Secure permissions
            
            # Generate backup path
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"backup_{timestamp}.zip"
            
            # Create temporary directory
            temp_dir = self.backup_dir / f"temp_{timestamp}"
            temp_dir.mkdir(exist_ok=True)
            
            try:
                # Backup database and configs
                db_tables = await self._backup_database(temp_dir / "database")
                config_files = await self._backup_configs(temp_dir / "config")
                
                # Create archive
                shutil.make_archive(
                    str(backup_path.with_suffix('')),
                    'zip',
                    temp_dir,
                    compresslevel=settings.BACKUP_COMPRESSION_LEVEL
                )
                
                # Encrypt if enabled
                if self._fernet:
                    with open(backup_path, 'rb') as f:
                        data = f.read()
                    encrypted_data = self._fernet.encrypt(data)
                    with open(backup_path, 'wb') as f:
                        f.write(encrypted_data)
                
                # Create metadata
                size_bytes = os.path.getsize(backup_path)
                metadata = BackupMetadata(
                    backup_path=str(backup_path),
                    timestamp=datetime.utcnow(),
                    version=settings.VERSION,
                    size_bytes=size_bytes,
                    status="success",
                    database_tables=db_tables,
                    config_files=config_files,
                    created_by=user.id if user else None,
                    is_encrypted=bool(self._fernet),
                    compression_level=settings.BACKUP_COMPRESSION_LEVEL
                )
                
                db.add(metadata)
                db.commit()
                db.refresh(metadata)
                
                return metadata.to_dict()
                
            finally:
                # Cleanup
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
        
        except Exception as e:
            logger.error(f"Backup creation failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Backup creation failed: {str(e)}"
            )
    
    async def restore_backup(self, backup_path: str, db: Session) -> Dict[str, Any]:
        """Restore system from backup"""
        try:
            backup_path = Path(backup_path)
            if not backup_path.exists():
                raise FileNotFoundError("Backup file not found")
            
            # Create temp directory
            temp_dir = self.backup_dir / f"restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            temp_dir.mkdir(exist_ok=True)
            
            try:
                # Decrypt if needed
                if self._fernet:
                    with open(backup_path, 'rb') as f:
                        encrypted_data = f.read()
                    decrypted_data = self._fernet.decrypt(encrypted_data)
                    with open(temp_dir / backup_path.name, 'wb') as f:
                        f.write(decrypted_data)
                    backup_path = temp_dir / backup_path.name
                
                # Extract archive
                shutil.unpack_archive(backup_path, temp_dir)
                
                # Restore database and configs
                await self._restore_database(temp_dir / "database", db)
                await self._restore_configs(temp_dir / "config")
                
                return {"status": "success", "message": "System restored successfully"}
                
            finally:
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
        
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Restore failed: {str(e)}"
            )
    
    async def list_backups(self, db: Session) -> List[Dict[str, Any]]:
        """List available backups"""
        try:
            backups = db.query(BackupMetadata).order_by(BackupMetadata.timestamp.desc()).all()
            return [backup.to_dict() for backup in backups]
        except Exception as e:
            logger.error(f"Failed to list backups: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list backups: {str(e)}"
            )
    
    async def delete_backup(self, backup_path: str, db: Session) -> Dict[str, Any]:
        """Delete a backup"""
        try:
            backup_path = Path(backup_path)
            if backup_path.exists():
                backup_path.unlink()
            
            backup = db.query(BackupMetadata).filter_by(backup_path=str(backup_path)).first()
            if backup:
                db.delete(backup)
                db.commit()
            
            return {"status": "success", "message": "Backup deleted successfully"}
        
        except Exception as e:
            logger.error(f"Failed to delete backup: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete backup: {str(e)}"
            )
    
    async def _backup_database(self, backup_path: Path) -> List[str]:
        """Backup database tables"""
        backup_path.mkdir(parents=True, exist_ok=True)
        tables = []
        
        try:
            # Get all table names
            result = db.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            tables = [row[0] for row in result]
            
            for table in tables:
                # Export table data to CSV
                table_path = backup_path / f"{table}.csv"
                with open(table_path, 'w', encoding='utf-8') as f:
                    copy_sql = f"COPY {table} TO STDOUT WITH CSV HEADER"
                    cur = db.connection().cursor()
                    cur.copy_expert(copy_sql, f)
                
                # Export table schema
                schema_path = backup_path / f"{table}_schema.sql"
                with open(schema_path, 'w', encoding='utf-8') as f:
                    # Get table schema
                    schema_sql = f"""
                    SELECT 
                        'CREATE TABLE ' || tablename || ' (' ||
                        string_agg(
                            column_name || ' ' || data_type ||
                            CASE 
                                WHEN character_maximum_length IS NOT NULL 
                                THEN '(' || character_maximum_length || ')'
                                ELSE ''
                            END ||
                            CASE 
                                WHEN is_nullable = 'NO' 
                                THEN ' NOT NULL'
                                ELSE ''
                            END,
                            ', '
                        ) || ');'
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    GROUP BY tablename;
                    """
                    result = db.execute(schema_sql).scalar()
                    f.write(result)
            
            return tables
            
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise
    
    async def _backup_configs(self, backup_path: Path) -> List[str]:
        """Backup configuration files"""
        backup_path.mkdir(parents=True, exist_ok=True)
        config_files = []
        
        try:
            # List of config files to backup
            files_to_backup = [
                '.env',
                'alembic.ini',
                'prometheus.yml',
                'docker-compose.yml'
            ]
            
            for file in files_to_backup:
                src = Path(file)
                if src.exists():
                    dst = backup_path / file
                    shutil.copy2(src, dst)
                    config_files.append(file)
            
            return config_files
            
        except Exception as e:
            logger.error(f"Config backup failed: {str(e)}")
            raise
    
    async def _restore_database(self, backup_path: Path, db: Session):
        """Restore database from backup"""
        try:
            # Get all table files
            table_files = list(backup_path.glob("*.csv"))
            
            for table_file in table_files:
                table_name = table_file.stem
                
                # First restore schema
                schema_file = backup_path / f"{table_name}_schema.sql"
                if schema_file.exists():
                    with open(schema_file, 'r', encoding='utf-8') as f:
                        schema_sql = f.read()
                        db.execute(schema_sql)
                
                # Then restore data
                with open(table_file, 'r', encoding='utf-8') as f:
                    copy_sql = f"COPY {table_name} FROM STDIN WITH CSV HEADER"
                    cur = db.connection().cursor()
                    cur.copy_expert(copy_sql, f)
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            logger.error(f"Database restore failed: {str(e)}")
            raise
    
    async def _restore_configs(self, backup_path: Path):
        """Restore configuration files"""
        try:
            # List of config files to restore
            files_to_restore = [
                '.env',
                'alembic.ini',
                'prometheus.yml',
                'docker-compose.yml'
            ]
            
            for file in files_to_restore:
                src = backup_path / file
                if src.exists():
                    dst = Path(file)
                    # Create backup of existing config
                    if dst.exists():
                        backup = dst.with_suffix('.bak')
                        shutil.copy2(dst, backup)
                    # Restore from backup
                    shutil.copy2(src, dst)
            
        except Exception as e:
            logger.error(f"Config restore failed: {str(e)}")
            raise

# Create global instance
backup_service = BackupService()
