"""
User CRUD operations
"""

from typing import List, Optional, Union, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User, UserCreate, UserUpdate
from .base import CRUDBase

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    CRUD operations for User model
    """
    async def get_by_telegram_id(
        self,
        db: AsyncSession,
        telegram_id: int
    ) -> Optional[User]:
        """Get user by Telegram ID"""
        query = select(self.model).where(self.model.telegram_id == telegram_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_active_users(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get active users"""
        return await self.get_multi(
            db,
            skip=skip,
            limit=limit,
            filters={"is_active": True, "is_banned": False}
        )

    async def update_credit(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        amount: float
    ) -> Optional[User]:
        """Update user credit"""
        user = await self.get(db=db, id=user_id)
        if not user:
            return None
            
        # Ensure credit doesn't go negative
        new_credit = max(0, user.credit + amount)
        return await self.update(
            db=db,
            db_obj=user,
            obj_in={"credit": new_credit}
        )

    async def ban_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        ban: bool = True
    ) -> Optional[User]:
        """Ban or unban user"""
        user = await self.get(db=db, id=user_id)
        if not user:
            return None
            
        return await self.update(
            db=db,
            db_obj=user,
            obj_in={"is_banned": ban}
        )

    async def get_user_stats(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user statistics"""
        user = await self.get(db=db, id=user_id)
        if not user:
            return {}
            
        active_subs = [s for s in user.subscriptions if s.is_active]
        total_traffic = sum(s.total_traffic for s in user.subscriptions)
        used_traffic = sum(s.used_traffic for s in user.subscriptions)
        
        return {
            "credit": user.credit,
            "active_services": len(active_subs),
            "total_traffic": total_traffic,
            "used_traffic": used_traffic,
            "remaining_traffic": total_traffic - used_traffic,
            "download": sum(s.download for s in user.subscriptions),
            "upload": sum(s.upload for s in user.subscriptions)
        }

    async def count_active_users(self, db: AsyncSession) -> int:
        """Count active users"""
        return await self.count(
            db,
            filters={"is_active": True, "is_banned": False}
        )

# Create CRUD instance
user = CRUDUser(User) 