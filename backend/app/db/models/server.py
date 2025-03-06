from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from .base import BaseModel

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

class ServerBase(SQLModel):
    name: str = Field(index=True)
    host: str  # IP or domain
    port: int = Field(default=2053)
    location: ServerLocation
    status: ServerStatus = Field(default=ServerStatus.ACTIVE)
    capacity: int  # Maximum number of users
    current_users: int = Field(default=0)
    bandwidth_limit: Optional[float] = Field(default=None)  # in Gbps
    bandwidth_used: float = Field(default=0.0)  # in Gbps
    xui_username: str
    xui_password: str
    xui_panel_url: str  # 3x-ui panel URL
    description: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None)  # Comma-separated tags

class Server(BaseModel, ServerBase, table=True):
    """Server model with relationships"""
    subscriptions: List["Subscription"] = Relationship(back_populates="server")

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
    """Schema for server creation"""
    pass

class ServerUpdate(SQLModel):
    """Schema for server update"""
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    location: Optional[ServerLocation] = None
    status: Optional[ServerStatus] = None
    capacity: Optional[int] = None
    current_users: Optional[int] = None
    bandwidth_limit: Optional[float] = None
    bandwidth_used: Optional[float] = None
    xui_username: Optional[str] = None
    xui_password: Optional[str] = None
    xui_panel_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

class ServerRead(ServerBase):
    """Schema for reading server data"""
    id: int
    load_percentage: float
    is_available: bool

    class Config:
        orm_mode = True

class ServerWithStats(ServerRead):
    """Schema for server data with detailed statistics"""
    total_bandwidth_used: float
    average_user_bandwidth: float
    uptime_percentage: float
    subscription_count: int

    class Config:
        orm_mode = True

# Prevent circular imports
from .subscription import Subscription
