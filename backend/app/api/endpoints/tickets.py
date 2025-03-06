from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from datetime import datetime

from ...db.session import get_session
from ...db.models.ticket import (
    Ticket,
    TicketMessage,
    TicketCreate,
    TicketUpdate,
    TicketRead,
    TicketMessageCreate,
    TicketStatus,
    TicketPriority,
    TicketCategory
)
from ...db.models.user import User, UserRole
from ..deps import get_current_active_user, get_current_active_staff

router = APIRouter()

@router.get("/", response_model=List[TicketRead])
async def list_tickets(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None
) -> Any:
    """
    Retrieve tickets.
    Regular users can only see their own tickets.
    Staff can see all tickets.
    """
    query = select(Ticket)
    
    # Regular users can only see their own tickets
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        query = query.where(Ticket.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if category:
        query = query.where(Ticket.category == category)
    
    # Apply pagination
    tickets = db.exec(query.offset(skip).limit(limit)).all()
    return tickets

@router.post("/", response_model=TicketRead)
async def create_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new ticket with initial message.
    """
    # Create ticket
    ticket = Ticket(
        user_id=current_user.id,
        title=ticket_in.title,
        category=ticket_in.category,
        priority=ticket_in.priority,
        subscription_id=ticket_in.subscription_id
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Create initial message
    message = TicketMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=ticket_in.content
    )
    db.add(message)
    db.commit()
    
    return ticket

@router.get("/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get ticket by ID.
    Regular users can only access their own tickets.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if (current_user.id != ticket.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return ticket

@router.post("/{ticket_id}/messages")
async def add_ticket_message(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    message_in: TicketMessageCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Add message to ticket.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if (current_user.id != ticket.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create message
    message = TicketMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=message_in.content,
        is_system_message=message_in.is_system_message,
        attachment_url=message_in.attachment_url
    )
    
    # Update ticket status
    if current_user.role in [UserRole.ADMIN, UserRole.SUPPORT]:
        ticket.status = TicketStatus.PENDING_USER
    else:
        ticket.status = TicketStatus.IN_PROGRESS
    
    db.add(message)
    db.add(ticket)
    db.commit()
    
    return {"msg": "Message added successfully"}

@router.post("/{ticket_id}/attachment")
async def upload_ticket_attachment(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Upload attachment for ticket message.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if (current_user.id != ticket.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Save file
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filename = f"ticket_{ticket_id}_{timestamp}_{file.filename}"
    filepath = f"uploads/tickets/{filename}"
    
    # TODO: Implement file storage (local/S3/etc.)
    # with open(filepath, "wb") as buffer:
    #     buffer.write(await file.read())
    
    return {"file_url": filepath}

@router.post("/{ticket_id}/assign")
async def assign_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    staff_id: int,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Assign ticket to staff member.
    Only accessible by admin and support staff.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Verify staff member exists
    staff = db.get(User, staff_id)
    if not staff or staff.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staff member"
        )
    
    ticket.assign_to_staff(staff_id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/close")
async def close_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    resolution: str,
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Close ticket with resolution.
    Only accessible by admin and support staff.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    ticket.close_ticket(resolution)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/reopen")
async def reopen_ticket(
    *,
    db: Session = Depends(get_session),
    ticket_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Reopen closed ticket.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if (current_user.id != ticket.user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if ticket.status != TicketStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is not closed"
        )
    
    ticket.status = TicketStatus.IN_PROGRESS
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.get("/stats")
async def get_ticket_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_staff)
) -> Any:
    """
    Get ticket statistics.
    Only accessible by admin and support staff.
    """
    tickets = db.exec(select(Ticket)).all()
    
    # Calculate statistics
    total_tickets = len(tickets)
    open_tickets = sum(1 for t in tickets if t.status in [TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    pending_user = sum(1 for t in tickets if t.status == TicketStatus.PENDING_USER)
    resolved_tickets = sum(1 for t in tickets if t.status == TicketStatus.RESOLVED)
    
    # Calculate average response time (placeholder)
    avg_response_time = 24  # hours
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "pending_user": pending_user,
        "resolved_tickets": resolved_tickets,
        "avg_response_time": avg_response_time
    }
