"""
Server models and schemas
"""
from typing import Dict, Optional
from pydantic import BaseModel, HttpUrl, validator
from sqlmodel import Field, SQLModel
from datetime import datetime

class ServerBase(SQLModel):
    """Base server model"""
    name: str = Field(index=True)
    url: HttpUrl
    type: str = Field(default="3x-ui")  # For future panel type support
    username: str
    is_active: bool = Field(default=True)
    max_users: int = Field(default=100)
    description: Optional[str] = None
    
    # System stats
    load: float = Field(default=0.0)
    memory_used: float = Field(default=0.0)
    memory_total: float = Field(default=0.0)
    cpu_usage: float = Field(default=0.0)
    network_in: int = Field(default=0)
    network_out: int = Field(default=0)
    last_check: datetime = Field(default_factory=datetime.utcnow)

    @validator("type")
    def validate_server_type(cls, v):
        """Validate server type"""
        allowed_types = ["3x-ui"]  # Add more types as they're supported
        if v not in allowed_types:
            raise ValueError(f"Server type must be one of: {', '.join(allowed_types)}")
        return v

class Server(ServerBase, table=True):
    """Server model for database"""
    id: Optional[int] = Field(default=None, primary_key=True)
    password: str

class ServerCreate(ServerBase):
    """Server creation schema"""
    password: str

class ServerUpdate(BaseModel):
    """Server update schema"""
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None
    description: Optional[str] = None

class ServerInDB(ServerBase):
    """Server in database schema"""
    id: int
    password: str

class ServerWithStats(ServerInDB):
    """Server with statistics schema"""
    stats: Dict 