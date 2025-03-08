"""
Server failover management system
"""
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.crud.server import server as server_crud
from ...models.server import Server
from ..monitoring.server_health import monitor
from ..balancer.load_balancer import balancer

class FailoverManager:
    """Manage server failover and recovery"""
    
    def __init__(self):
        self.health_check_interval = 60  # seconds
        self.recovery_threshold = 3  # Number of successful health checks needed
        self.failover_threshold = 3  # Number of failed health checks before failover
        self._failed_checks: Dict[int, int] = {}
        self._recovery_checks: Dict[int, int] = {}
        self._failed_servers: Set[int] = set()
        self._is_running = False
        self._last_notification: Dict[int, datetime] = {}
        self.notification_cooldown = 300  # 5 minutes

    async def start_monitoring(self, db: AsyncSession):
        """Start failover monitoring"""
        if self._is_running:
            return
            
        self._is_running = True
        while self._is_running:
            await self._check_all_servers(db)
            await asyncio.sleep(self.health_check_interval)

    async def stop_monitoring(self):
        """Stop failover monitoring"""
        self._is_running = False

    async def get_failover_status(
        self,
        db: AsyncSession,
        server_id: int
    ) -> Dict[str, any]:
        """Get server failover status"""
        server = await server_crud.get(db=db, id=server_id)
        if not server:
            return {"status": "error", "message": "Server not found"}
            
        return {
            "server_id": server_id,
            "is_failed": server_id in self._failed_servers,
            "failed_checks": self._failed_checks.get(server_id, 0),
            "recovery_checks": self._recovery_checks.get(server_id, 0),
            "status": "failed" if server_id in self._failed_servers else "healthy"
        }

    async def _check_all_servers(self, db: AsyncSession):
        """Check health of all active servers"""
        servers = await server_crud.get_active_servers(db)
        
        for server in servers:
            await self._check_server(db, server)

    async def _check_server(self, db: AsyncSession, server: Server):
        """Check individual server health and handle failover"""
        health = await monitor.check_server_health(db, server.id)
        
        if health.get("status") != "healthy":
            await self._handle_unhealthy_server(db, server)
        else:
            await self._handle_healthy_server(db, server)

    async def _handle_unhealthy_server(self, db: AsyncSession, server: Server):
        """Handle unhealthy server status"""
        self._failed_checks[server.id] = self._failed_checks.get(server.id, 0) + 1
        self._recovery_checks[server.id] = 0
        
        # Check if we need to trigger failover
        if (self._failed_checks[server.id] >= self.failover_threshold and
            server.id not in self._failed_servers):
            await self._initiate_failover(db, server)

    async def _handle_healthy_server(self, db: AsyncSession, server: Server):
        """Handle healthy server status"""
        self._failed_checks[server.id] = 0
        
        if server.id in self._failed_servers:
            self._recovery_checks[server.id] = (
                self._recovery_checks.get(server.id, 0) + 1
            )
            
            # Check if server has recovered
            if self._recovery_checks[server.id] >= self.recovery_threshold:
                await self._handle_server_recovery(db, server)

    async def _initiate_failover(self, db: AsyncSession, server: Server):
        """Initiate failover process for failed server"""
        self._failed_servers.add(server.id)
        
        # Get server stats before failover
        stats = await server_crud.get_server_stats(db=db, server_id=server.id)
        if not stats or "error" in stats:
            return
            
        # Find alternative servers for each client
        moves = []
        for inbound in stats.get("inbounds", []):
            for client in inbound.get("clients", []):
                # Find best alternative server
                alt_server = await balancer.get_best_server(
                    db,
                    required_traffic=client.get("up", 0) + client.get("down", 0)
                )
                
                if alt_server:
                    moves.append({
                        "client_email": client["email"],
                        "from_server": server.id,
                        "to_server": alt_server.id,
                        "reason": "Server failover"
                    })
                    
        # Update server status
        await server_crud.update(
            db=db,
            db_obj=server,
            obj_in={"is_active": False}
        )
        
        # Notify about failover
        await self._send_failover_notification(server.id, moves)

    async def _handle_server_recovery(self, db: AsyncSession, server: Server):
        """Handle server recovery process"""
        self._failed_servers.remove(server.id)
        self._recovery_checks[server.id] = 0
        
        # Update server status
        await server_crud.update(
            db=db,
            db_obj=server,
            obj_in={"is_active": True}
        )
        
        # Notify about recovery
        await self._send_recovery_notification(server.id)

    async def _send_failover_notification(
        self,
        server_id: int,
        moves: List[Dict]
    ):
        """Send failover notification"""
        if not self._should_notify(server_id):
            return
            
        # TODO: Implement notification system
        # This could be integrated with your existing notification system
        # (e.g., Telegram bot, email, etc.)
        print(f"Server {server_id} has failed. Failover initiated.")
        print(f"Moving {len(moves)} clients to alternative servers.")
        
        self._last_notification[server_id] = datetime.utcnow()

    async def _send_recovery_notification(self, server_id: int):
        """Send recovery notification"""
        if not self._should_notify(server_id):
            return
            
        # TODO: Implement notification system
        print(f"Server {server_id} has recovered and is back online.")
        
        self._last_notification[server_id] = datetime.utcnow()

    def _should_notify(self, server_id: int) -> bool:
        """Check if we should send a notification"""
        last_time = self._last_notification.get(server_id)
        if not last_time:
            return True
            
        return (
            datetime.utcnow() - last_time
        ).total_seconds() >= self.notification_cooldown

# Create failover manager instance
failover_manager = FailoverManager() 