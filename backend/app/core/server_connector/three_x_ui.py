"""
3x-ui server panel connector implementation
"""
import json
from typing import Dict, List, Optional
import aiohttp
from .base import BaseServerConnector, ServerStats, InboundInfo

class ThreeXUIConnector(BaseServerConnector):
    """3x-ui panel connector implementation"""
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """Make HTTP request to panel"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {"Cookie": f"session={self.session_token}"} if self.session_token else {}
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=headers,
                ssl=False  # Skip SSL verification as many panels use self-signed certs
            ) as response:
                if response.status == 200:
                    # Get session cookie if it's a login request
                    if endpoint == "login" and "session" in response.cookies:
                        self.session_token = response.cookies["session"].value
                    return await response.json()
                return {}

    async def login(self, username: str, password: str) -> bool:
        """Login to 3x-ui panel"""
        data = {"username": username, "password": password}
        response = await self._make_request("POST", "login", data=data)
        return bool(self.session_token)

    async def get_system_status(self) -> ServerStats:
        """Get server system status"""
        response = await self._make_request("POST", "server/status")
        if not response:
            raise Exception("Failed to get server status")
            
        return ServerStats(
            uptime=response.get("uptime", 0),
            load=response.get("load", 0.0),
            memory_used=response.get("mem_used", 0),
            memory_total=response.get("mem_total", 0),
            cpu_usage=response.get("cpu", 0.0),
            network_in=response.get("net_in", 0),
            network_out=response.get("net_out", 0)
        )

    async def get_inbounds(self) -> List[InboundInfo]:
        """Get all inbounds"""
        response = await self._make_request("POST", "panel/api/inbounds/list")
        inbounds = []
        
        for obj in response.get("obj", []):
            inbounds.append(InboundInfo(
                id=obj.get("id", 0),
                enable=obj.get("enable", False),
                remark=obj.get("remark", ""),
                protocol=obj.get("protocol", ""),
                port=obj.get("port", 0),
                total=obj.get("total", 0),
                up=obj.get("up", 0),
                down=obj.get("down", 0),
                expiry_time=obj.get("expiryTime", None)
            ))
            
        return inbounds

    async def add_client(
        self,
        inbound_id: int,
        email: str,
        uuid: str,
        enable: bool = True,
        total_gb: Optional[int] = None,
        expiry_time: Optional[int] = None
    ) -> bool:
        """Add a client to an inbound"""
        # First get the inbound settings
        response = await self._make_request(
            "POST",
            f"panel/api/inbounds/get/{inbound_id}"
        )
        
        if not response.get("obj"):
            return False
            
        inbound = response["obj"]
        settings = json.loads(inbound.get("settings", "{}"))
        clients = settings.get("clients", [])
        
        # Create new client
        new_client = {
            "id": uuid,
            "email": email,
            "enable": enable,
            "totalGB": total_gb if total_gb is not None else 0,
            "expiryTime": expiry_time if expiry_time is not None else 0
        }
        
        clients.append(new_client)
        settings["clients"] = clients
        inbound["settings"] = json.dumps(settings)
        
        # Update inbound
        update_response = await self._make_request(
            "POST",
            "panel/api/inbounds/update",
            data=inbound
        )
        
        return bool(update_response)

    async def remove_client(self, inbound_id: int, email: str) -> bool:
        """Remove a client from an inbound"""
        # Get current inbound settings
        response = await self._make_request(
            "POST",
            f"panel/api/inbounds/get/{inbound_id}"
        )
        
        if not response.get("obj"):
            return False
            
        inbound = response["obj"]
        settings = json.loads(inbound.get("settings", "{}"))
        clients = settings.get("clients", [])
        
        # Remove client with matching email
        settings["clients"] = [c for c in clients if c.get("email") != email]
        inbound["settings"] = json.dumps(settings)
        
        # Update inbound
        update_response = await self._make_request(
            "POST",
            "panel/api/inbounds/update",
            data=inbound
        )
        
        return bool(update_response)

    async def update_client(
        self,
        inbound_id: int,
        email: str,
        uuid: Optional[str] = None,
        enable: Optional[bool] = None,
        total_gb: Optional[int] = None,
        expiry_time: Optional[int] = None
    ) -> bool:
        """Update a client's configuration"""
        # Get current inbound settings
        response = await self._make_request(
            "POST",
            f"panel/api/inbounds/get/{inbound_id}"
        )
        
        if not response.get("obj"):
            return False
            
        inbound = response["obj"]
        settings = json.loads(inbound.get("settings", "{}"))
        clients = settings.get("clients", [])
        
        # Update client with matching email
        for client in clients:
            if client.get("email") == email:
                if uuid is not None:
                    client["id"] = uuid
                if enable is not None:
                    client["enable"] = enable
                if total_gb is not None:
                    client["totalGB"] = total_gb
                if expiry_time is not None:
                    client["expiryTime"] = expiry_time
                break
                
        settings["clients"] = clients
        inbound["settings"] = json.dumps(settings)
        
        # Update inbound
        update_response = await self._make_request(
            "POST",
            "panel/api/inbounds/update",
            data=inbound
        )
        
        return bool(update_response)

    async def get_client_stats(self, email: str) -> Dict:
        """Get client statistics"""
        # Get all inbounds to find the client
        inbounds = await self.get_inbounds()
        stats = {
            "enable": False,
            "total": 0,
            "up": 0,
            "down": 0,
            "expiry_time": None
        }
        
        for inbound in inbounds:
            response = await self._make_request(
                "POST",
                f"panel/api/inbounds/get/{inbound.id}"
            )
            
            if not response.get("obj"):
                continue
                
            settings = json.loads(response["obj"].get("settings", "{}"))
            for client in settings.get("clients", []):
                if client.get("email") == email:
                    stats["enable"] = client.get("enable", False)
                    stats["total"] = client.get("totalGB", 0)
                    stats["up"] = client.get("up", 0)
                    stats["down"] = client.get("down", 0)
                    stats["expiry_time"] = client.get("expiryTime", None)
                    return stats
                    
        return stats 