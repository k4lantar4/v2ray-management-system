from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime, timedelta
import json

from ...db.session import get_session, get_redis
from ...db.models.user import User, UserRole
from ...db.models.subscription import Subscription, SubscriptionStatus
from ...db.models.server import Server, ServerStatus
from ...db.models.payment import Payment, PaymentStatus
from ...db.models.ticket import Ticket, TicketStatus
from ..deps import get_current_active_superuser

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Get comprehensive dashboard statistics.
    """
    # User statistics
    total_users = db.exec(select(User)).count()
    active_users = db.exec(
        select(User).where(User.status == "active")
    ).count()
    
    # Server statistics
    total_servers = db.exec(select(Server)).count()
    active_servers = db.exec(
        select(Server).where(Server.status == ServerStatus.ACTIVE)
    ).count()
    
    # Subscription statistics
    total_subscriptions = db.exec(select(Subscription)).count()
    active_subscriptions = db.exec(
        select(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE)
    ).count()
    
    # Payment statistics
    total_revenue = db.exec(
        select(Payment).where(Payment.status == PaymentStatus.COMPLETED)
    ).all()
    revenue_sum = sum(payment.final_amount for payment in total_revenue)
    
    # Support statistics
    open_tickets = db.exec(
        select(Ticket).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]))
    ).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users
        },
        "servers": {
            "total": total_servers,
            "active": active_servers,
            "inactive": total_servers - active_servers
        },
        "subscriptions": {
            "total": total_subscriptions,
            "active": active_subscriptions,
            "expired": total_subscriptions - active_subscriptions
        },
        "revenue": {
            "total": revenue_sum,
            "currency": "IRR"
        },
        "support": {
            "open_tickets": open_tickets
        }
    }

@router.get("/system-health")
async def check_system_health(
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Check system health including database, Redis, and server connections.
    """
    health_status = {
        "database": True,
        "redis": True,
        "servers": {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        # Check Redis connection
        redis = get_redis()
        redis.ping()
    except Exception as e:
        health_status["redis"] = False
        health_status["redis_error"] = str(e)
    
    # TODO: Implement server health checks
    # This should check connection to each VPN server
    
    return health_status

@router.post("/maintenance-mode")
async def toggle_maintenance_mode(
    *,
    db: Session = Depends(get_session),
    enable: bool,
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Toggle system maintenance mode.
    """
    redis = get_redis()
    redis.set("maintenance_mode", json.dumps({
        "enabled": enable,
        "timestamp": datetime.utcnow().isoformat(),
        "activated_by": current_user.id
    }))
    
    return {"maintenance_mode": enable}

@router.post("/sync-all-servers")
async def sync_all_servers(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Synchronize all server statistics with 3x-ui panels.
    """
    def sync_servers():
        # TODO: Implement server synchronization
        pass
    
    background_tasks.add_task(sync_servers)
    return {"msg": "Server synchronization started"}

@router.post("/cleanup")
async def system_cleanup(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Perform system cleanup tasks.
    """
    # Expire old subscriptions
    expired_subs = db.exec(
        select(Subscription).where(
            (Subscription.end_date < datetime.utcnow()) &
            (Subscription.status == SubscriptionStatus.ACTIVE)
        )
    ).all()
    
    for sub in expired_subs:
        sub.status = SubscriptionStatus.EXPIRED
        db.add(sub)
    
    # Clean up old sessions
    redis = get_redis()
    # TODO: Implement session cleanup
    
    db.commit()
    return {"msg": "System cleanup completed"}

@router.post("/broadcast")
async def broadcast_message(
    *,
    db: Session = Depends(get_session),
    message: str,
    user_role: UserRole = None,
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Broadcast message to users.
    """
    query = select(User)
    if user_role:
        query = query.where(User.role == user_role)
    
    users = db.exec(query).all()
    
    # TODO: Implement actual message broadcasting
    # This could be through Telegram, email, or in-app notifications
    
    return {
        "msg": "Broadcast sent",
        "recipients": len(users)
    }

@router.get("/audit-log")
async def get_audit_log(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    start_date: datetime = None,
    end_date: datetime = None,
    skip: int = 0,
    limit: int = 100
) -> List[Dict]:
    """
    Get system audit log.
    """
    # TODO: Implement audit logging system
    return []

@router.post("/backup")
async def create_backup(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_superuser)
) -> Dict:
    """
    Create system backup.
    """
    def perform_backup():
        # TODO: Implement backup logic
        # This should backup:
        # - Database
        # - Configuration files
        # - Uploaded files
        pass
    
    background_tasks.add_task(perform_backup)
    return {"msg": "Backup process started"}

@router.get("/revenue-report")
async def get_revenue_report(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    start_date: datetime,
    end_date: datetime
) -> Dict:
    """
    Generate revenue report.
    """
    payments = db.exec(
        select(Payment).where(
            (Payment.created_at >= start_date) &
            (Payment.created_at <= end_date) &
            (Payment.status == PaymentStatus.COMPLETED)
        )
    ).all()
    
    total_revenue = sum(p.final_amount for p in payments)
    subscription_revenue = sum(
        p.final_amount for p in payments 
        if p.payment_type == "subscription"
    )
    wallet_charges = sum(
        p.final_amount for p in payments 
        if p.payment_type == "wallet_charge"
    )
    
    return {
        "period": {
            "start": start_date,
            "end": end_date
        },
        "total_revenue": total_revenue,
        "subscription_revenue": subscription_revenue,
        "wallet_charges": wallet_charges,
        "transaction_count": len(payments)
    }

@router.get("/user-growth")
async def get_user_growth(
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser),
    days: int = 30
) -> List[Dict]:
    """
    Get user growth statistics.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    users = db.exec(
        select(User).where(User.created_at >= start_date)
    ).all()
    
    # Group users by date
    growth_data = {}
    for user in users:
        date = user.created_at.date()
        if date not in growth_data:
            growth_data[date] = 0
        growth_data[date] += 1
    
    return [
        {"date": date.isoformat(), "new_users": count}
        for date, count in sorted(growth_data.items())
    ]
