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
        self.port_range = (10000, 60000)  # Configurable port range
        self.retry_attempts = 5  # Increased as per requirement
        self.retry_delay = 5  # seconds
        self.cookie_check_interval = 1800  # 30 minutes in seconds
        self.notification_service = NotificationService()
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get authenticated aiohttp session with cookie management"""
        session = aiohttp.ClientSession()
        
        # Check if we have a valid session cookie
        if (self.server.xui_session_cookie and 
            self.server.xui_cookie_expiry and 
            self.server.xui_cookie_expiry > datetime.utcnow()):
            
            # Set the cookie in session
            session.cookie_jar.update_cookies({
                'session': self.server.xui_session_cookie
            })
            return session
            
        # No valid cookie, try to login
        for attempt in range(self.retry_attempts):
            try:
                await self._login(session)
                return session
            except Exception as e:
                self.server.failed_login_attempts += 1
                self.server.last_failed_login = datetime.utcnow()
                
                if attempt == self.retry_attempts - 1:
                    # Send notification after max retries
                    await self.notification_service.send_system_alert(
                        "server_login_failed",
                        {
                            "server_id": self.server.id,
                            "server_name": self.server.name,
                            "failed_attempts": self.server.failed_login_attempts,
                            "error": str(e)
                        }
                    )
                    raise
                    
                logger.warning(f"Login retry {attempt + 1} after error: {str(e)}")
                await asyncio.sleep(self.retry_delay)
                
        return session
    
    async def _login(self, session: aiohttp.ClientSession) -> None:
        """Login to 3x-ui panel and manage session cookies"""
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
                
                # Get session cookie from response
                cookies = response.cookies
                session_cookie = cookies.get('session')
                if not session_cookie:
                    raise Exception("No session cookie received in login response")
                
                # Update server with new cookie and reset failed attempts
                self.server.xui_session_cookie = session_cookie.value
                self.server.xui_cookie_expiry = datetime.utcnow() + timedelta(days=30)
                self.server.failed_login_attempts = 0
                self.server.last_failed_login = None
                await self.server.save()
                
                # Set cookie in session
                session.cookie_jar.update_cookies({
                    'session': session_cookie.value
                })
                
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
        """Make authenticated request with cookie management"""
        try:
            async with await self._get_session() as session:
                headers = {"Content-Type": "application/json"}
                
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
                                
                    except aiohttp.ClientResponseError as e:
                        if e.status == 401:
                            # Session expired, clear cookie and try login again
                            self.server.xui_session_cookie = None
                            self.server.xui_cookie_expiry = None
                            await self.server.save()
                            
                            # Get new session with fresh login
                            session = await self._get_session()
                            continue
                            
                        raise
                        
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
    
    async def get_panel_info(self) -> PanelInfo:
        """Get panel version and information"""
        try:
            response = await self._make_request("GET", "panel/info")
            if response.get("success"):
                data = response["data"]
                return PanelInfo(
                    version=data["version"],
                    xray_version=data["xrayVersion"],
                    remote_addr=data["remoteAddr"],
                    remote_port=data["remotePort"],
                    total_inbounds=data["totalInbounds"],
                    up_time=data["upTime"],
                    last_config_time=datetime.fromtimestamp(data["lastConfigTime"])
                )
            raise Exception(f"Failed to get panel info: {response.get('msg')}")
        except Exception as e:
            logger.error(f"Error getting panel info: {str(e)}")
            raise

    async def get_system_status(self) -> SystemStatus:
        """Get detailed system status"""
        try:
            response = await self._make_request("GET", "system/status")
            if response.get("success"):
                data = response["data"]
                return SystemStatus(
                    cpu=data["cpu"],
                    memory=data["memory"],
                    swap=data["swap"],
                    disk=data["disk"],
                    xray_status=data["xrayStatus"],
                    xray_version=data["xrayVersion"],
                    load_avg_1=data["loadavg"][0],
                    load_avg_5=data["loadavg"][1],
                    load_avg_15=data["loadavg"][2],
                    tcp_count=data["tcpCount"],
                    udp_count=data["udpCount"],
                    network_rx=data["networkRx"],
                    network_tx=data["networkTx"],
                    network_in=data["networkIn"],
                    network_out=data["networkOut"]
                )
            raise Exception(f"Failed to get system status: {response.get('msg')}")
        except Exception as e:
            logger.error(f"Error getting system status: {str(e)}")
            raise

    async def list_inbounds(self) -> List[InboundConfig]:
        """Get all inbound configurations"""
        try:
            response = await self._make_request("GET", "inbounds")
            if response.get("success"):
                return [
                    InboundConfig(
                        id=inbound["id"],
                        tag=inbound["tag"],
                        protocol=inbound["protocol"],
                        port=inbound["port"],
                        settings=inbound["settings"],
                        stream_settings=inbound["streamSettings"],
                        sniffing=inbound["sniffing"],
                        remark=inbound["remark"],
                        enable=inbound["enable"],
                        up=inbound["up"],
                        down=inbound["down"],
                        total=inbound["total"],
                        expiry_time=inbound.get("expiryTime")
                    )
                    for inbound in response["data"]
                ]
            raise Exception(f"Failed to list inbounds: {response.get('msg')}")
        except Exception as e:
            logger.error(f"Error listing inbounds: {str(e)}")
            raise

    async def get_inbound_traffic(self, inbound_id: int) -> TrafficStats:
        """Get traffic statistics for specific inbound"""
        try:
            response = await self._make_request(
                "GET",
                f"inbounds/{inbound_id}/traffic"
            )
            if response.get("success"):
                data = response["data"]
                return TrafficStats(
                    inbound_id=inbound_id,
                    up=data["up"],
                    down=data["down"],
                    total=data["total"],
                    last_reset_time=datetime.fromtimestamp(data["lastResetTime"])
                    if data.get("lastResetTime")
                    else None,
                    enable=data["enable"]
                )
            raise Exception(f"Failed to get inbound traffic: {response.get('msg')}")
        except Exception as e:
            logger.error(f"Error getting inbound traffic: {str(e)}")
            raise

    async def backup_config(self) -> Dict:
        """Backup panel configuration"""
        try:
            response = await self._make_request("POST", "panel/backup")
            if response.get("success"):
                return response["data"]
            raise Exception(f"Failed to backup config: {response.get('msg')}")
        except Exception as e:
            logger.error(f"Error backing up config: {str(e)}")
            raise

    async def restore_config(self, backup_data: Dict) -> bool:
        """Restore panel configuration"""
        try:
            response = await self._make_request(
                "POST",
                "panel/restore",
                data=backup_data
            )
            return response.get("success", False)
        except Exception as e:
            logger.error(f"Error restoring config: {str(e)}")
            raise

    async def update_panel_settings(self, settings: PanelSettings) -> bool:
        """Update panel settings"""
        try:
            response = await self._make_request(
                "PUT",
                "panel/settings",
                data=settings.dict()
            )
            return response.get("success", False)
        except Exception as e:
            logger.error(f"Error updating panel settings: {str(e)}")
            raise

    async def get_server_stats(self, db: Session = None) -> Dict:
        """Get server statistics with enhanced metrics and monitoring"""
        start_time = time.time()
        is_online = True
        cookie_valid = True
        login_success = True
        error_message = None
        
        try:
            response = await self._make_request("GET", "server/stats")
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            if response.get("success"):
                stats = response["data"]
                metrics = {
                    "cpu_usage": stats.get("cpu", 0),
                    "memory_usage": stats.get("memory", 0),
                    "disk_usage": stats.get("disk", 0),
                    "network_in": stats.get("network", {}).get("in", 0),
                    "network_out": stats.get("network", {}).get("out", 0),
                    "uptime": stats.get("uptime", 0),
                    "load_avg": stats.get("loadavg", [0, 0, 0]),
                    "active_connections": stats.get("connections", 0),
                    "response_time": response_time
                }
                
                # Record metrics if db session provided
                if db:
                    try:
                        await self.server.record_metrics(
                            db=db,
                            cpu_usage=metrics["cpu_usage"],
                            memory_usage=metrics["memory_usage"],
                            disk_usage=metrics["disk_usage"],
                            bandwidth_in=metrics["network_in"] / (1024 * 1024 * 1024),  # Convert to GB
                            bandwidth_out=metrics["network_out"] / (1024 * 1024 * 1024),  # Convert to GB
                            active_connections=metrics["active_connections"],
                            load_avg=metrics["load_avg"],
                            response_time=response_time,
                            is_online=is_online,
                            cookie_valid=cookie_valid,
                            login_success=login_success,
                            error_message=error_message
                        )
                    except Exception as e:
                        logger.error(f"Error recording metrics: {str(e)}")
                
                return metrics
            else:
                error_message = f"Failed to get server stats: {response.get('msg')}"
                raise Exception(error_message)
                
        except aiohttp.ClientError as e:
            is_online = False
            error_message = f"Network error: {str(e)}"
            logger.error(f"Network error getting XUI server stats: {str(e)}")
            raise
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error getting XUI server stats: {str(e)}")
            raise
            
        finally:
            # Record failure metrics if db session provided
            if not is_online and db:
                try:
                    await self.server.record_metrics(
                        db=db,
                        cpu_usage=0,
                        memory_usage=0,
                        disk_usage=0,
                        bandwidth_in=0,
                        bandwidth_out=0,
                        active_connections=0,
                        load_avg=[0, 0, 0],
                        response_time=None,
                        is_online=is_online,
                        cookie_valid=cookie_valid,
                        login_success=login_success,
                        error_message=error_message
                    )
                except Exception as e:
                    logger.error(f"Error recording failure metrics: {str(e)}")
    
    @staticmethod
    async def sync_all_servers(servers: List[Server], db: Session) -> Dict:
        """Sync all servers with their respective 3x-ui panels and record metrics"""
        results = {
            "success": [],
            "failed": []
        }
        
        notification_service = NotificationService()
        
        for server in servers:
            try:
                # Update sync status
                server.sync_status = ServerSyncStatus.IN_PROGRESS
                server.last_sync = datetime.utcnow()
                await db.commit()
                
                xui = XUIService(server)
                stats = await xui.get_server_stats(db=db)  # Pass db to record metrics
                
                # Update server status based on comprehensive metrics
                if (
                    stats["cpu_usage"] > 90 or
                    stats["memory_usage"] > 90 or
                    stats["disk_usage"] > 95 or
                    any(load > 10 for load in stats["load_avg"])
                ):
                    new_status = ServerStatus.MAINTENANCE
                elif (
                    stats["cpu_usage"] > 75 or
                    stats["memory_usage"] > 80
                ):
                    new_status = ServerStatus.HIGH_LOAD
                else:
                    new_status = ServerStatus.ACTIVE
                
                # Notify if status changed
                if server.status != new_status:
                    await notification_service.notify_server_status(
                        server.id,
                        new_status,
                        stats
                    )
                    server.status = new_status
                
                server.current_users = await xui._get_active_users_count()
                server.bandwidth_used = (
                    stats["network_in"] + stats["network_out"]
                ) / (1024 * 1024 * 1024)  # Convert to GB
                
                # Check cookie expiration
                if (
                    server.xui_cookie_expiry and
                    (server.xui_cookie_expiry - datetime.utcnow()).total_seconds() < 86400  # 24 hours
                ):
                    await notification_service.send_system_alert(
                        "cookie_expiring_soon",
                        {
                            "server_id": server.id,
                            "server_name": server.name,
                            "expiry_time": server.xui_cookie_expiry.isoformat()
                        }
                    )
                
                # Update sync status
                server.sync_status = ServerSyncStatus.SUCCESS
                server.sync_error = None
                
                results["success"].append({
                    "server_id": server.id,
                    "stats": stats,
                    "status": server.status
                })
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error syncing server {server.id}: {error_msg}")
                
                server.sync_status = ServerSyncStatus.FAILED
                server.sync_error = error_msg
                
                results["failed"].append({
                    "server_id": server.id,
                    "error": error_msg
                })
                
                await notification_service.send_system_alert(
                    "server_sync_failed",
                    {
                        "server_id": server.id,
                        "server_name": server.name,
                        "error": error_msg,
                        "failed_login_attempts": server.failed_login_attempts,
                        "last_failed_login": server.last_failed_login.isoformat() if server.last_failed_login else None
                    }
                )
            
            finally:
                await db.commit()
        
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
