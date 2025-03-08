"""
Server health monitoring system
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.crud.server import server as server_crud
from ...models.server import Server

class ServerHealthMonitor:
    """Monitor server health and manage alerts"""
    
    def __init__(self):
        self.alert_thresholds = {
            "cpu": 80.0,  # CPU usage threshold (%)
            "memory": 85.0,  # Memory usage threshold (%)
            "load": 5.0,  # Load average threshold
            "disk": 90.0,  # Disk usage threshold (%)
        }
        self.check_interval = 300  # 5 minutes
        self._last_check: Dict[int, datetime] = {}
        self._alerts: Dict[int, List[str]] = {}

    async def check_server_health(
        self,
        db: AsyncSession,
        server_id: int
    ) -> Dict[str, any]:
        """Check server health and return status"""
        server = await server_crud.get(db=db, id=server_id)
        if not server:
            return {"status": "error", "message": "Server not found"}
            
        # Check if we need to update stats
        if self._should_update_stats(server_id):
            await server_crud.update_server_load(db=db, server_id=server_id)
            self._last_check[server_id] = datetime.utcnow()
            
        return self._analyze_server_health(server)

    async def get_system_alerts(
        self,
        db: AsyncSession,
        server_id: int
    ) -> List[str]:
        """Get current system alerts"""
        if server_id not in self._alerts:
            await self.check_server_health(db, server_id)
        return self._alerts.get(server_id, [])

    def _should_update_stats(self, server_id: int) -> bool:
        """Check if we should update server stats"""
        if server_id not in self._last_check:
            return True
            
        last_check = self._last_check[server_id]
        return (datetime.utcnow() - last_check).total_seconds() >= self.check_interval

    def _analyze_server_health(self, server: Server) -> Dict[str, any]:
        """Analyze server health metrics"""
        alerts = []
        status = "healthy"
        
        # Check CPU usage
        if server.cpu_usage >= self.alert_thresholds["cpu"]:
            alerts.append(f"High CPU usage: {server.cpu_usage}%")
            status = "warning"
            
        # Check memory usage
        memory_usage = (server.memory_used / server.memory_total) * 100
        if memory_usage >= self.alert_thresholds["memory"]:
            alerts.append(f"High memory usage: {memory_usage:.1f}%")
            status = "warning"
            
        # Check load average
        if server.load >= self.alert_thresholds["load"]:
            alerts.append(f"High system load: {server.load}")
            status = "warning"
            
        # Store alerts
        self._alerts[server.id] = alerts
        
        return {
            "status": status,
            "alerts": alerts,
            "metrics": {
                "cpu_usage": server.cpu_usage,
                "memory_usage": memory_usage,
                "load": server.load,
                "network": {
                    "in": server.network_in,
                    "out": server.network_out
                }
            }
        }

# Create monitor instance
monitor = ServerHealthMonitor() 