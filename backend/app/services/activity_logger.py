from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Session
from ..db.session import engine
from ..db.models.user import User
from ..db.models.activity_log import ActivityLog

class ActivityLogger:
    """Service for logging user and system activities"""
    
    @staticmethod
    async def log_activity(
        activity_type: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> ActivityLog:
        """Log an activity with the given details"""
        
        log_entry = ActivityLog(
            activity_type=activity_type,
            user_id=user_id,
            details=details or {},
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        
        with Session(engine) as session:
            session.add(log_entry)
            session.commit()
            session.refresh(log_entry)
            
        return log_entry
    
    @staticmethod
    async def get_user_activities(
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        activity_type: Optional[str] = None
    ) -> list[ActivityLog]:
        """Get activities for a specific user"""
        
        with Session(engine) as session:
            query = session.query(ActivityLog).filter(ActivityLog.user_id == user_id)
            
            if activity_type:
                query = query.filter(ActivityLog.activity_type == activity_type)
                
            activities = query.order_by(ActivityLog.timestamp.desc())\
                             .offset(offset)\
                             .limit(limit)\
                             .all()
                             
        return activities
    
    @staticmethod
    async def get_system_activities(
        limit: int = 50,
        offset: int = 0,
        activity_type: Optional[str] = None
    ) -> list[ActivityLog]:
        """Get system-wide activities"""
        
        with Session(engine) as session:
            query = session.query(ActivityLog)
            
            if activity_type:
                query = query.filter(ActivityLog.activity_type == activity_type)
                
            activities = query.order_by(ActivityLog.timestamp.desc())\
                             .offset(offset)\
                             .limit(limit)\
                             .all()
                             
        return activities
    
    @staticmethod
    async def get_activity_stats(user_id: Optional[int] = None) -> Dict[str, Any]:
        """Get activity statistics"""
        
        with Session(engine) as session:
            query = session.query(ActivityLog)
            
            if user_id:
                query = query.filter(ActivityLog.user_id == user_id)
                
            total_activities = query.count()
            activity_types = query.with_entities(ActivityLog.activity_type)\
                                .distinct()\
                                .all()
            
            # Get counts per activity type
            type_counts = {}
            for activity_type in activity_types:
                count = query.filter(ActivityLog.activity_type == activity_type[0]).count()
                type_counts[activity_type[0]] = count
                
        return {
            "total_activities": total_activities,
            "activity_types": type_counts,
            "last_activity": query.order_by(ActivityLog.timestamp.desc()).first()
        }
