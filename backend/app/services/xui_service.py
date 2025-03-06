from typing import Dict, List, Optional, Tuple
import aiohttp
import json
import logging
import uuid
import random
import asyncio
from datetime import datetime, timedelta

from ..core.config import settings
from ..db.models.subscription import Subscription, SubscriptionStatus
from ..db.models.server import Server, ServerStatus

logger = logging.getLogger(__name__)

class XUIService:
    """Service for interacting with 3x-ui panel"""
    
    def __init__(self, server: Server):
        self.server = server
        self.base_url = server.xui_panel_url
        self.username = server.xui_username
        self.password = server.xui_password
        self.session_token = None
        self.port_range = (10000, 60000)  # Configurable port range
        self.retry_attempts = 3
        self.retry_delay = 5  # seconds
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get authenticated aiohttp session with retry logic"""
        session = aiohttp.ClientSession()
        for attempt in range(self.retry_attempts):
            try:
                if not self.session_token:
                    await self._login(session)
                return session
            except Exception as e:
                if attempt == self.retry_attempts - 1:
                    raise
                logger.warning(f"Retry {attempt + 1} after error: {str(e)}")
                await asyncio.sleep(self.retry_delay)
        return session
    
    async def _login(self, session: aiohttp.ClientSession) -> None:
        """Login to 3x-ui panel with enhanced error handling"""
        try:
            login_data = {
                "username": self.username,
                "password": self.password
            }
            async with session.post(
                f"{self.base_url}/login",
                json=login_data,
                timeout=30
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(
                        f"Login failed with status {response.status}: {error_text}"
                    )
                
                data = await response.json()
                self.session_token = data.get("token")
                if not self.session_token:
                    raise Exception("No token received in login response")
                
        except aiohttp.ClientError as e:
            logger.error(f"Network error during XUI login: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"XUI login error: {str(e)}")
            raise
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        timeout: int = 30
    ) -> Dict:
        """Make authenticated request to 3x-ui panel with comprehensive error handling"""
        try:
            async with await self._get_session() as session:
                headers = {
                    "Authorization": f"Bearer {self.session_token}",
                    "Content-Type": "application/json"
                } if self.session_token else {}
                
                for attempt in range(self.retry_attempts):
                    try:
                        if method.upper() == "GET":
                            async with session.get(
                                f"{self.base_url}/{endpoint}",
                                headers=headers,
                                timeout=timeout
                            ) as response:
                                return await self._handle_response(response)
                        else:
                            async with session.post(
                                f"{self.base_url}/{endpoint}",
                                headers=headers,
                                json=data,
                                timeout=timeout
                            ) as response:
                                return await self._handle_response(response)
                    except Exception as e:
                        if attempt == self.retry_attempts - 1:
                            raise
                        logger.warning(f"Request retry {attempt + 1} after error: {str(e)}")
                        await asyncio.sleep(self.retry_delay)
                        
        except Exception as e:
            logger.error(f"XUI request error: {str(e)}")
            raise
    
    async def _handle_response(self, response: aiohttp.ClientResponse) -> Dict:
        """Handle API response with proper error handling"""
        if response.status == 401:
            self.session_token = None  # Reset token for re-authentication
            raise Exception("Authentication failed")
            
        try:
            data = await response.json()
        except json.JSONDecodeError:
            text = await response.text()
            raise Exception(f"Invalid JSON response: {text}")
            
        if not data.get("success"):
            raise Exception(f"API error: {data.get('msg', 'Unknown error')}")
            
        return data
    
    async def create_client(self, subscription: Subscription) -> Dict:
        """Create new client in 3x-ui panel with optimized configuration"""
        try:
            port = await self._generate_unique_port()
            uuid_str = str(uuid.uuid4())
            
            client_data = {
                "remark": f"user_{subscription.user_id}",
                "protocol": "vless",
                "port": port,
                "settings": {
                    "clients": [{
                        "id": uuid_str,
                        "flow": "xtls-rprx-direct",
                        "email": f"user_{subscription.user_id}@vpn.local",
                        "limitIp": 0,  # 0 means unlimited
                        "totalGB": subscription.data_limit,
                        "expiryTime": int(subscription.end_date.timestamp())
                    }],
                    "decryption": "none",
                    "fallbacks": []
                },
                "streamSettings": {
                    "network": "tcp",
                    "security": "tls",
                    "tlsSettings": {
                        "serverName": self.server.domain,
                        "certificates": [{
                            "certificateFile": "/root/cert.crt",
                            "keyFile": "/root/private.key"
                        }]
                    }
                },
                "sniffing": {
                    "enabled": True,
                    "destOverride": ["http", "tls"]
                }
            }
            
            response = await self._make_request(
                "POST",
                "inbounds",
                data=client_data
            )
            
            if response.get("success"):
                config = self._generate_config(
                    uuid_str,
                    port,
                    subscription.user_id
                )
                return {
                    "client_id": uuid_str,
                    "config": config
                }
            else:
                raise Exception(f"Failed to create client: {response.get('msg')}")
                
        except Exception as e:
            logger.error(f"Error creating XUI client: {str(e)}")
            raise
    
    async def _generate_unique_port(self) -> int:
        """Generate unique port number with collision checking"""
        try:
            existing_ports = await self._get_used_ports()
            while True:
                port = random.randint(
                    self.port_range[0],
                    self.port_range[1]
                )
                if port not in existing_ports:
                    return port
        except Exception as e:
            logger.error(f"Error generating port: {str(e)}")
            raise
    
    async def _get_used_ports(self) -> List[int]:
        """Get list of ports currently in use"""
        try:
            response = await self._make_request("GET", "inbounds")
            return [
                client["port"]
                for client in response.get("data", [])
                if "port" in client
            ]
        except Exception:
            return []
    
    def _generate_config(
        self,
        uuid_str: str,
        port: int,
        user_id: int
    ) -> str:
        """Generate V2Ray client configuration"""
        config = {
            "v": "2",
            "ps": f"VIP-{user_id}",
            "add": self.server.domain,
            "port": port,
            "id": uuid_str,
            "aid": 0,
            "net": "tcp",
            "type": "none",
            "host": "",
            "path": "",
            "tls": "tls"
        }
        return f"vless://{json.dumps(config)}"
    
    async def update_client(
        self,
        subscription: Subscription,
        client_id: str
    ) -> Dict:
        """Update existing client configuration"""
        try:
            client_data = {
                "settings": {
                    "clients": [{
                        "id": client_id,
                        "email": f"user_{subscription.user_id}@vpn.local",
                        "totalGB": subscription.data_limit,
                        "expiryTime": int(subscription.end_date.timestamp())
                    }]
                }
            }
            
            response = await self._make_request(
                "PUT",
                f"inbounds/client/{client_id}",
                data=client_data
            )
            
            if response.get("success"):
                return {
                    "client_id": client_id,
                    "status": "updated"
                }
            else:
                raise Exception(f"Failed to update client: {response.get('msg')}")
                
        except Exception as e:
            logger.error(f"Error updating XUI client: {str(e)}")
            raise
    
    async def delete_client(self, client_id: str) -> bool:
        """Delete client from 3x-ui panel"""
        try:
            response = await self._make_request(
                "DELETE",
                f"inbounds/client/{client_id}"
            )
            return response.get("success", False)
        except Exception as e:
            logger.error(f"Error deleting XUI client: {str(e)}")
            raise
    
    async def get_client_stats(self, client_id: str) -> Dict:
        """Get client usage statistics"""
        try:
            response = await self._make_request(
                "GET",
                f"inbounds/client/{client_id}/stats"
            )
            
            if response.get("success"):
                stats = response["data"]
                return {
                    "up": stats.get("up", 0),
                    "down": stats.get("down", 0),
                    "total": stats.get("total", 0),
                    "expiry": stats.get("expiryTime", 0)
                }
            else:
                raise Exception(f"Failed to get client stats: {response.get('msg')}")
                
        except Exception as e:
            logger.error(f"Error getting XUI client stats: {str(e)}")
            raise
    
    async def get_server_stats(self) -> Dict:
        """Get server statistics with enhanced metrics"""
        try:
            response = await self._make_request("GET", "server/stats")
            
            if response.get("success"):
                stats = response["data"]
                return {
                    "cpu_usage": stats.get("cpu", 0),
                    "memory_usage": stats.get("memory", 0),
                    "disk_usage": stats.get("disk", 0),
                    "network_in": stats.get("network", {}).get("in", 0),
                    "network_out": stats.get("network", {}).get("out", 0),
                    "uptime": stats.get("uptime", 0),
                    "load_avg": stats.get("loadavg", [0, 0, 0]),
                    "active_connections": stats.get("connections", 0)
                }
            else:
                raise Exception(f"Failed to get server stats: {response.get('msg')}")
                
        except Exception as e:
            logger.error(f"Error getting XUI server stats: {str(e)}")
            raise
    
    @staticmethod
    async def sync_all_servers(servers: List[Server]) -> Dict:
        """Sync all servers with their respective 3x-ui panels"""
        results = {
            "success": [],
            "failed": []
        }
        
        for server in servers:
            try:
                xui = XUIService(server)
                stats = await xui.get_server_stats()
                
                # Update server status based on comprehensive metrics
                if (
                    stats["cpu_usage"] > 90 or
                    stats["memory_usage"] > 90 or
                    stats["disk_usage"] > 95 or
                    any(load > 10 for load in stats["load_avg"])
                ):
                    server.status = ServerStatus.MAINTENANCE
                elif (
                    stats["cpu_usage"] > 75 or
                    stats["memory_usage"] > 80
                ):
                    server.status = ServerStatus.HIGH_LOAD
                else:
                    server.status = ServerStatus.ACTIVE
                
                server.current_users = await xui._get_active_users_count()
                server.bandwidth_used = (
                    stats["network_in"] + stats["network_out"]
                ) / (1024 * 1024 * 1024)  # Convert to GB
                
                results["success"].append({
                    "server_id": server.id,
                    "stats": stats,
                    "status": server.status
                })
                
            except Exception as e:
                logger.error(f"Error syncing server {server.id}: {str(e)}")
                results["failed"].append({
                    "server_id": server.id,
                    "error": str(e)
                })
        
        return results
    
    async def _get_active_users_count(self) -> int:
        """Get count of active users on the server"""
        try:
            response = await self._make_request("GET", "inbounds")
            if response.get("success"):
                return len([
                    client for client in response["data"]
                    if client.get("enable", False) and 
                    datetime.fromtimestamp(client.get("expiryTime", 0)) > datetime.utcnow()
                ])
            return 0
        except Exception:
            return 0
