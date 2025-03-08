"""
Server CRUD operations
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.server import Server, ServerCreate, ServerUpdate
from .base import CRUDBase
from ...core.server_connector.base import BaseServerConnector
from ...core.server_connector.three_x_ui import ThreeXUIConnector

class CRUDServer(CRUDBase[Server, ServerCreate, ServerUpdate]):
    """
    CRUD operations for Server model
    """
    
    async def get_active_servers(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Server]:
        """Get active servers"""
        return await self.get_multi(
            db,
            skip=skip,
            limit=limit,
            filters={"is_active": True}
        )

    async def get_server_stats(
        self,
        db: AsyncSession,
        server_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get server statistics"""
        server = await self.get(db=db, id=server_id)
        if not server:
            return None
            
        connector = self._get_connector(server)
        try:
            # Login to server panel
            if not await connector.login(server.username, server.password):
                return {"error": "Failed to login to server panel"}
                
            # Get system status
            stats = await connector.get_system_status()
            
            # Get inbounds info
            inbounds = await connector.get_inbounds()
            
            return {
                "system": stats.dict(),
                "inbounds": [inbound.dict() for inbound in inbounds],
                "total_clients": sum(
                    len(json.loads(inbound.settings).get("clients", []))
                    for inbound in inbounds
                )
            }
        except Exception as e:
            return {"error": str(e)}

    async def test_connection(
        self,
        db: AsyncSession,
        server_id: int
    ) -> bool:
        """Test server connection"""
        server = await self.get(db=db, id=server_id)
        if not server:
            return False
            
        connector = self._get_connector(server)
        try:
            return await connector.login(server.username, server.password)
        except:
            return False

    async def update_server_load(
        self,
        db: AsyncSession,
        server_id: int
    ) -> bool:
        """Update server load information"""
        server = await self.get(db=db, id=server_id)
        if not server:
            return False
            
        connector = self._get_connector(server)
        try:
            # Login and get system status
            if not await connector.login(server.username, server.password):
                return False
                
            stats = await connector.get_system_status()
            
            # Update server load
            await self.update(
                db=db,
                db_obj=server,
                obj_in={
                    "load": stats.load,
                    "memory_used": stats.memory_used,
                    "memory_total": stats.memory_total,
                    "cpu_usage": stats.cpu_usage,
                    "network_in": stats.network_in,
                    "network_out": stats.network_out
                }
            )
            return True
        except:
            return False

    def _get_connector(self, server: Server) -> BaseServerConnector:
        """Get appropriate connector for server type"""
        if server.type == "3x-ui":
            return ThreeXUIConnector(server.url)
        # Add more panel types here
        raise ValueError(f"Unsupported server type: {server.type}")

# Create CRUD instance
server = CRUDServer(Server) 