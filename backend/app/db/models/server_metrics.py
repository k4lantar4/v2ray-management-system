from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from .base import BaseModel

class ServerMetrics(BaseModel, table=True):
    """Historical server performance metrics"""
    server_id: int = Field(foreign_key="server.id", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Resource usage
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    bandwidth_in: float  # in GB
    bandwidth_out: float  # in GB
    active_connections: int
    
    # Load metrics
    load_avg_1m: float
    load_avg_5m: float
    load_avg_15m: float
    
    # Status metrics
    response_time: Optional[float] = Field(default=None)  # in milliseconds
    is_online: bool = Field(default=True)
    
    # Session info
    cookie_valid: bool = Field(default=True)
    login_success: bool = Field(default=True)
    error_message: Optional[str] = Field(default=None)
    
    # Relationships
    server: "Server" = Relationship(back_populates="metrics_history")

    class Config:
        arbitrary_types_allowed = True

# Prevent circular imports
from .server import Server
