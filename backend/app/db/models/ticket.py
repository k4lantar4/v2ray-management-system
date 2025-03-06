from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from .base import BaseModel

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    RESOLVED = "resolved"
    PENDING_USER = "pending_user"

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketCategory(str, Enum):
    TECHNICAL = "technical"
    BILLING = "billing"
    ACCOUNT = "account"
    VPN_ISSUES = "vpn_issues"
    OTHER = "other"

class TicketBase(SQLModel):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    title: str
    category: TicketCategory
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    status: TicketStatus = Field(default=TicketStatus.OPEN)
    assigned_to: Optional[int] = Field(default=None, foreign_key="user.id")
    subscription_id: Optional[int] = Field(default=None, foreign_key="subscription.id")

class Ticket(BaseModel, TicketBase, table=True):
    """Ticket model with relationships"""
    user: "User" = Relationship(
        back_populates="tickets",
        sa_relationship_kwargs={"foreign_keys": "[Ticket.user_id]"}
    )
    assigned_staff: Optional["User"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[Ticket.assigned_to]",
            "primaryjoin": "User.id==Ticket.assigned_to"
        }
    )
    subscription: Optional["Subscription"] = Relationship(back_populates="tickets")
    messages: List["TicketMessage"] = Relationship(back_populates="ticket")

    def assign_to_staff(self, staff_id: int):
        """Assign ticket to staff member"""
        self.assigned_to = staff_id
        if self.status == TicketStatus.OPEN:
            self.status = TicketStatus.IN_PROGRESS

    def close_ticket(self, resolution: str):
        """Close ticket with resolution"""
        self.status = TicketStatus.CLOSED
        TicketMessage(
            ticket_id=self.id,
            user_id=self.assigned_to,
            content=f"Ticket closed with resolution: {resolution}",
            is_system_message=True
        )

class TicketMessageBase(SQLModel):
    ticket_id: int = Field(foreign_key="ticket.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    content: str
    is_system_message: bool = Field(default=False)
    attachment_url: Optional[str] = Field(default=None)

class TicketMessage(BaseModel, TicketMessageBase, table=True):
    """Ticket message model with relationships"""
    ticket: Ticket = Relationship(back_populates="messages")
    user: Optional["User"] = Relationship()

    def add_attachment(self, url: str):
        """Add attachment to message"""
        self.attachment_url = url

class TicketCreate(SQLModel):
    """Schema for ticket creation"""
    title: str
    category: TicketCategory
    content: str  # Initial message
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM
    subscription_id: Optional[int] = None

class TicketUpdate(SQLModel):
    """Schema for ticket update"""
    title: Optional[str] = None
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_to: Optional[int] = None

class TicketMessageCreate(SQLModel):
    """Schema for ticket message creation"""
    content: str
    is_system_message: Optional[bool] = False
    attachment_url: Optional[str] = None

class TicketRead(TicketBase):
    """Schema for reading ticket data"""
    id: int
    messages: List["TicketMessageRead"] = []
    user: "UserRead"
    assigned_staff: Optional["UserRead"] = None

    class Config:
        orm_mode = True

class TicketMessageRead(TicketMessageBase):
    """Schema for reading ticket message data"""
    id: int
    created_at: datetime
    user: Optional["UserRead"] = None

    class Config:
        orm_mode = True

# Prevent circular imports
from datetime import datetime
from .user import User, UserRead
from .subscription import Subscription

# Update forward refs
TicketRead.update_forward_refs(TicketMessageRead=TicketMessageRead, UserRead=UserRead)
TicketMessageRead.update_forward_refs(UserRead=UserRead)
