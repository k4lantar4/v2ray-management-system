"""
Load balancer for server management
"""
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from ...db.crud.server import server as server_crud
from ...models.server import Server
from ..monitoring.server_health import monitor

class LoadBalancer:
    """Load balancer for distributing users across servers"""
    
    def __init__(self):
        self.load_threshold = 0.8  # 80% load threshold
        self.memory_threshold = 0.85  # 85% memory threshold
        self._server_weights: Dict[int, float] = {}

    async def get_best_server(
        self,
        db: AsyncSession,
        required_traffic: Optional[int] = None
    ) -> Optional[Server]:
        """Get the best server for new user based on current load"""
        servers = await server_crud.get_active_servers(db)
        if not servers:
            return None
            
        best_server = None
        best_score = float('inf')
        
        for server in servers:
            # Skip servers that are near capacity
            if await self._is_server_near_capacity(db, server):
                continue
                
            # Calculate server score (lower is better)
            score = await self._calculate_server_score(db, server, required_traffic)
            if score < best_score:
                best_score = score
                best_server = server
                
        return best_server

    async def rebalance_if_needed(
        self,
        db: AsyncSession
    ) -> List[Dict[str, any]]:
        """Check if rebalancing is needed and return suggested moves"""
        servers = await server_crud.get_active_servers(db)
        if not servers:
            return []
            
        moves = []
        overloaded = []
        underutilized = []
        
        # Identify overloaded and underutilized servers
        for server in servers:
            load = await self._get_server_load(db, server)
            if load > self.load_threshold:
                overloaded.append(server)
            elif load < self.load_threshold / 2:
                underutilized.append(server)
                
        # Generate moves to balance load
        for source in overloaded:
            source_stats = await server_crud.get_server_stats(db, source.id)
            if not source_stats or "error" in source_stats:
                continue
                
            for client in source_stats.get("clients", []):
                for target in underutilized:
                    if await self._can_accept_client(db, target, client):
                        moves.append({
                            "client_email": client["email"],
                            "from_server": source.id,
                            "to_server": target.id,
                            "reason": "Load balancing"
                        })
                        break
                        
        return moves

    async def _is_server_near_capacity(
        self,
        db: AsyncSession,
        server: Server
    ) -> bool:
        """Check if server is near its capacity"""
        stats = await server_crud.get_server_stats(db, server.id)
        if not stats or "error" in stats:
            return True
            
        system = stats.get("system", {})
        
        # Check CPU and memory usage
        if system.get("cpu_usage", 0) > self.load_threshold * 100:
            return True
            
        memory_used = system.get("memory_used", 0)
        memory_total = system.get("memory_total", 1)
        if memory_used / memory_total > self.memory_threshold:
            return True
            
        # Check number of clients
        total_clients = stats.get("total_clients", 0)
        if total_clients >= server.max_users:
            return True
            
        return False

    async def _calculate_server_score(
        self,
        db: AsyncSession,
        server: Server,
        required_traffic: Optional[int]
    ) -> float:
        """Calculate server score for load balancing (lower is better)"""
        stats = await server_crud.get_server_stats(db, server.id)
        if not stats or "error" in stats:
            return float('inf')
            
        system = stats.get("system", {})
        
        # Base score on current load
        cpu_score = system.get("cpu_usage", 0) / 100
        memory_score = system.get("memory_used", 0) / system.get("memory_total", 1)
        load_score = system.get("load", 0) / 10
        
        # Consider network traffic if required
        traffic_score = 0
        if required_traffic:
            current_traffic = (
                system.get("network_in", 0) +
                system.get("network_out", 0)
            ) / (1024 * 1024 * 1024)  # Convert to GB
            traffic_score = current_traffic / 100
            
        # Get health status
        health = await monitor.check_server_health(db, server.id)
        health_score = 1 if health.get("status") != "healthy" else 0
        
        # Calculate weighted score
        score = (
            cpu_score * 0.3 +
            memory_score * 0.3 +
            load_score * 0.2 +
            traffic_score * 0.1 +
            health_score * 0.1
        )
        
        return score

    async def _get_server_load(
        self,
        db: AsyncSession,
        server: Server
    ) -> float:
        """Get normalized server load"""
        stats = await server_crud.get_server_stats(db, server.id)
        if not stats or "error" in stats:
            return 1.0
            
        system = stats.get("system", {})
        
        cpu_load = system.get("cpu_usage", 0) / 100
        memory_load = system.get("memory_used", 0) / system.get("memory_total", 1)
        system_load = system.get("load", 0) / 10
        
        return (cpu_load + memory_load + system_load) / 3

    async def _can_accept_client(
        self,
        db: AsyncSession,
        server: Server,
        client: Dict
    ) -> bool:
        """Check if server can accept a new client"""
        if await self._is_server_near_capacity(db, server):
            return False
            
        # Check if adding client's traffic would overload the server
        stats = await server_crud.get_server_stats(db, server.id)
        if not stats or "error" in stats:
            return False
            
        system = stats.get("system", {})
        current_traffic = (
            system.get("network_in", 0) +
            system.get("network_out", 0)
        ) / (1024 * 1024 * 1024)  # Convert to GB
        
        client_traffic = (
            client.get("up", 0) +
            client.get("down", 0)
        ) / (1024 * 1024 * 1024)  # Convert to GB
        
        return (current_traffic + client_traffic) < (1000 * self.load_threshold)  # 1TB limit

# Create load balancer instance
balancer = LoadBalancer() 