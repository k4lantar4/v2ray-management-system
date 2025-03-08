"""
Utility functions for the Telegram bot
"""

import functools
from typing import Callable, Any
from telegram import Update
from telegram.ext import ContextTypes
from ..core.config import settings
from ..db.crud import user as user_crud

def admin_required(func: Callable) -> Callable:
    """Decorator to check if user is admin"""
    @functools.wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args: Any, **kwargs: Any):
        if not update.effective_user or update.effective_user.id not in settings.ADMIN_IDS:
            await update.message.reply_text("⛔️ شما دسترسی ادمین ندارید.")
            return
        return await func(update, context, *args, **kwargs)
    return wrapper

def user_required(func: Callable) -> Callable:
    """Decorator to check if user exists in database"""
    @functools.wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args: Any, **kwargs: Any):
        if not update.effective_user:
            return
            
        user = await user_crud.get_user_by_telegram_id(update.effective_user.id)
        if not user:
            await update.message.reply_text(
                "❌ شما هنوز ثبت نام نکرده‌اید.\n"
                "لطفا ابتدا دستور /start را ارسال کنید."
            )
            return
            
        if user.is_banned:
            await update.message.reply_text("⛔️ حساب کاربری شما مسدود شده است.")
            return
            
        return await func(update, context, *args, **kwargs)
    return wrapper

def format_message(text: str) -> str:
    """Format message text with proper RTL support"""
    # Add RTL mark at the start of each line
    lines = text.split("\n")
    formatted_lines = [f"\u200F{line}" if line.strip() else line for line in lines]
    return "\n".join(formatted_lines)

def format_bytes(size: float) -> str:
    """Format bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"

def format_duration(seconds: int) -> str:
    """Format seconds to human readable duration"""
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    
    parts = []
    if days > 0:
        parts.append(f"{days} روز")
    if hours > 0:
        parts.append(f"{hours} ساعت")
    if minutes > 0:
        parts.append(f"{minutes} دقیقه")
        
    return " و ".join(parts) if parts else "کمتر از یک دقیقه" 