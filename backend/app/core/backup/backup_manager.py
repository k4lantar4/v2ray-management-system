"""
Server backup management system
"""
from typing import Dict, List, Optional
from datetime import datetime
import json
import aiofiles
import os
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.crud.server import server as server_crud
from ...models.server import Server

class BackupManager:
    """Manage server backups and restoration"""
    
    def __init__(self):
        self.backup_path = "data/backups"
        self.max_backups = 5  # Maximum number of backups per server
        os.makedirs(self.backup_path, exist_ok=True)

    async def create_backup(
        self,
        db: AsyncSession,
        server_id: int
    ) -> Dict[str, any]:
        """Create server backup"""
        server = await server_crud.get(db=db, id=server_id)
        if not server:
            return {"status": "error", "message": "Server not found"}
            
        try:
            # Get server connector
            connector = server_crud._get_connector(server)
            if not await connector.login(server.username, server.password):
                return {"status": "error", "message": "Failed to connect to server"}
                
            # Get server configuration
            stats = await server_crud.get_server_stats(db=db, server_id=server_id)
            if not stats or "error" in stats:
                return {"status": "error", "message": "Failed to get server stats"}
                
            # Create backup data
            backup_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "server_id": server_id,
                "server_name": server.name,
                "configuration": stats,
                "inbounds": await connector.get_inbounds()
            }
            
            # Save backup
            backup_file = os.path.join(
                self.backup_path,
                f"server_{server_id}_{backup_data['timestamp']}.json"
            )
            
            async with aiofiles.open(backup_file, 'w') as f:
                await f.write(json.dumps(backup_data, indent=2))
                
            # Clean old backups
            await self._cleanup_old_backups(server_id)
            
            return {
                "status": "success",
                "message": "Backup created successfully",
                "backup_file": backup_file
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Backup failed: {str(e)}"}

    async def restore_backup(
        self,
        db: AsyncSession,
        server_id: int,
        backup_file: str
    ) -> Dict[str, any]:
        """Restore server from backup"""
        server = await server_crud.get(db=db, id=server_id)
        if not server:
            return {"status": "error", "message": "Server not found"}
            
        try:
            # Read backup file
            async with aiofiles.open(backup_file, 'r') as f:
                backup_data = json.loads(await f.read())
                
            # Verify backup
            if backup_data["server_id"] != server_id:
                return {
                    "status": "error",
                    "message": "Backup file does not match server ID"
                }
                
            # Get server connector
            connector = server_crud._get_connector(server)
            if not await connector.login(server.username, server.password):
                return {"status": "error", "message": "Failed to connect to server"}
                
            # Restore inbounds
            for inbound in backup_data["inbounds"]:
                await connector._make_request(
                    "POST",
                    "panel/api/inbounds/update",
                    data=inbound
                )
                
            return {
                "status": "success",
                "message": "Backup restored successfully"
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Restore failed: {str(e)}"}

    async def list_backups(
        self,
        server_id: int
    ) -> List[Dict[str, any]]:
        """List available backups for server"""
        backups = []
        prefix = f"server_{server_id}_"
        
        for file in os.listdir(self.backup_path):
            if file.startswith(prefix) and file.endswith(".json"):
                try:
                    async with aiofiles.open(
                        os.path.join(self.backup_path, file),
                        'r'
                    ) as f:
                        data = json.loads(await f.read())
                        backups.append({
                            "file": file,
                            "timestamp": data["timestamp"],
                            "server_name": data["server_name"],
                            "size": os.path.getsize(
                                os.path.join(self.backup_path, file)
                            )
                        })
                except:
                    continue
                    
        return sorted(backups, key=lambda x: x["timestamp"], reverse=True)

    async def _cleanup_old_backups(self, server_id: int):
        """Remove old backups exceeding max_backups"""
        backups = await self.list_backups(server_id)
        
        if len(backups) > self.max_backups:
            for backup in backups[self.max_backups:]:
                try:
                    os.remove(os.path.join(self.backup_path, backup["file"]))
                except:
                    continue

# Create backup manager instance
backup_manager = BackupManager() 