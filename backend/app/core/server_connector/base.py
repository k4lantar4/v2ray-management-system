"""
Base server connector interface
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from pydantic import BaseModel

class ServerStats(BaseModel):
    """Server statistics model"""
    uptime: int
    load: float
    memory_used: float
    memory_total: float
    cpu_usage: float
    network_in: int
    network_out: int

class InboundInfo(BaseModel):
    """Inbound information model"""
    id: int
    enable: bool
    remark: str
    protocol: str
    port: int
    total: int
    up: int
    down: int
    expiry_time: Optional[int] = None

class BaseServerConnector(ABC):
    """Base class for server panel connectors"""
    
    def __init__(self, base_url: str):
        """Initialize connector with base URL"""
        self.base_url = base_url.rstrip('/')
        self.session_token: Optional[str] = None
    
    @abstractmethod
    async def login(self, username: str, password: str) -> bool:
        """Login to server panel"""
        pass
    
    @abstractmethod
    async def get_system_status(self) -> ServerStats:
        """Get server system status"""
        pass
    
    @abstractmethod
    async def get_inbounds(self) -> List[InboundInfo]:
        """Get all inbounds"""
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def remove_client(self, inbound_id: int, email: str) -> bool:
        """Remove a client from an inbound"""
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def get_client_stats(self, email: str) -> Dict:
        """Get client statistics"""
        pass 