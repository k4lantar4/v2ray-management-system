"""
Server model for V2Ray servers
"""

from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from .base import BaseModel, TimestampModel
from datetime import datetime

class ServerLocation(str, Enum):
    GERMANY = "germany"
    USA = "usa"
    TURKEY = "turkey"
    NETHERLANDS = "netherlands"
    FRANCE = "france"

class ServerStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"
    FULL = "full"

class ServerSyncStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"

class ServerBase(SQLModel):
    """Base Server model"""
    name: str = Field(unique=True, index=True)
    host: str = Field(index=True)
    port: int = Field()
    username: str
    password: str
    api_port: int = Field(default=8080)
    is_active: bool = Field(default=True)
    max_users: int = Field(default=500)
    load: float = Field(default=0.0)
    bandwidth_limit: Optional[int] = Field(default=None)  # In GB
    notes: Optional[str] = Field(default=None)

class Server(ServerBase, TimestampModel, table=True):
    """Server model with relationships"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    subscriptions: List["Subscription"] = Relationship(back_populates="server")
    
    class Config:
        """Model configuration"""
        arbitrary_types_allowed = True

    async def record_metrics(
        self,
        db: Session,
        cpu_usage: float,
        memory_usage: float,
        disk_usage: float,
        bandwidth_in: float,
        bandwidth_out: float,
        active_connections: int,
        load_avg: List[float],
        response_time: Optional[float] = None,
        is_online: bool = True,
        cookie_valid: bool = True,
        login_success: bool = True,
        error_message: Optional[str] = None
    ) -> "ServerMetrics":
        """Record server metrics at current timestamp"""
        from .server_metrics import ServerMetrics
        
        metrics = ServerMetrics(
            server_id=self.id,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            disk_usage=disk_usage,
            bandwidth_in=bandwidth_in,
            bandwidth_out=bandwidth_out,
            active_connections=active_connections,
            load_avg_1m=load_avg[0],
            load_avg_5m=load_avg[1],
            load_avg_15m=load_avg[2],
            response_time=response_time,
            is_online=is_online,
            cookie_valid=cookie_valid,
            login_success=login_success,
            error_message=error_message
        )
        
        db.add(metrics)
        await db.commit()
        await db.refresh(metrics)
        
        return metrics

    async def get_metrics_history(
        self,
        db: Session,
        hours: int = 24
    ) -> List["ServerMetrics"]:
        """Get server metrics history for specified hours"""
        from .server_metrics import ServerMetrics
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return await db.query(ServerMetrics).filter(
            ServerMetrics.server_id == self.id,
            ServerMetrics.timestamp >= cutoff
        ).order_by(ServerMetrics.timestamp.desc()).all()

    async def get_average_metrics(
        self,
        db: Session,
        hours: int = 24
    ) -> Dict:
        """Get average metrics for specified time period"""
        from .server_metrics import ServerMetrics
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        metrics = await db.query(
            sa.func.avg(ServerMetrics.cpu_usage).label('avg_cpu'),
            sa.func.avg(ServerMetrics.memory_usage).label('avg_memory'),
            sa.func.avg(ServerMetrics.disk_usage).label('avg_disk'),
            sa.func.avg(ServerMetrics.bandwidth_in).label('avg_bandwidth_in'),
            sa.func.avg(ServerMetrics.bandwidth_out).label('avg_bandwidth_out'),
            sa.func.avg(ServerMetrics.active_connections).label('avg_connections'),
            sa.func.avg(ServerMetrics.response_time).label('avg_response_time')
        ).filter(
            ServerMetrics.server_id == self.id,
            ServerMetrics.timestamp >= cutoff
        ).first()
        
        return {
            'avg_cpu': metrics.avg_cpu or 0,
            'avg_memory': metrics.avg_memory or 0,
            'avg_disk': metrics.avg_disk or 0,
            'avg_bandwidth_in': metrics.avg_bandwidth_in or 0,
            'avg_bandwidth_out': metrics.avg_bandwidth_out or 0,
            'avg_connections': int(metrics.avg_connections or 0),
            'avg_response_time': metrics.avg_response_time
        }

    @property
    def is_available(self) -> bool:
        """Check if server can accept new users"""
        return (
            self.status == ServerStatus.ACTIVE and
            self.current_users < self.capacity
        )
    
    @property
    def load_percentage(self) -> float:
        """Calculate server load percentage"""
        return (self.current_users / self.capacity) * 100 if self.capacity > 0 else 0

    def update_usage(self, new_users: int, bandwidth_used: float):
        """Update server usage statistics"""
        self.current_users = new_users
        self.bandwidth_used = bandwidth_used
        if self.current_users >= self.capacity:
            self.status = ServerStatus.FULL

class ServerCreate(ServerBase):
    """Server creation schema"""
    pass

class ServerUpdate(SQLModel):
    """Server update schema"""
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_port: Optional[int] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None
    bandwidth_limit: Optional[int] = None
    notes: Optional[str] = None

class ServerRead(ServerBase):
    """Server read schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    active_users: int = Field(default=0)
    total_bandwidth: float = Field(default=0.0)  # In GB

class PanelInfo(SQLModel):
    """Schema for 3x-ui panel information"""
    version: str
    xray_version: str
    remote_addr: str
    remote_port: int
    total_inbounds: int
    up_time: int
    last_config_time: datetime

class InboundConfig(SQLModel):
    """Schema for inbound configuration"""
    id: int
    tag: str
    protocol: str
    port: int
    settings: Dict[str, Any]
    stream_settings: Dict[str, Any]
    sniffing: Dict[str, Any]
    remark: str
    enable: bool
    up: int
    down: int
    total: int
    expiry_time: Optional[int]

class TrafficStats(SQLModel):
    """Schema for traffic statistics"""
    inbound_id: int
    up: int
    down: int
    total: int
    last_reset_time: Optional[datetime]
    enable: bool

class SystemStatus(SQLModel):
    """Schema for system status"""
    cpu: float
    memory: float
    swap: float
    disk: float
    xray_status: bool
    xray_version: str
    load_avg_1: float
    load_avg_5: float
    load_avg_15: float
    tcp_count: int
    udp_count: int
    network_rx: int
    network_tx: int
    network_in: int
    network_out: int

class PanelSettings(SQLModel):
    """Schema for panel settings"""
    web_port: int
    web_username: str
    web_password: str
    web_base_path: str
    tls_enabled: bool
    cert_file: Optional[str]
    key_file: Optional[str]
    timezone: str
    xray_config: Dict[str, Any]

class ServerWithStats(ServerRead):
    """Schema for server data with detailed statistics"""
    total_bandwidth_used: float
    average_user_bandwidth: float
    uptime_percentage: float
    subscription_count: int
    panel_info: Optional[PanelInfo] = None
    system_status: Optional[SystemStatus] = None

    class Config:
        orm_mode = True

# Prevent circular imports
from .subscription import Subscription
