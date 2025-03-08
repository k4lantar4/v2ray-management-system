"""
Admin command handlers for the Telegram bot
"""

from telegram import Update
from telegram.ext import CommandHandler, ContextTypes, filters
from ...core.config import settings
from ...db.crud import user as user_crud
from ...db.crud import server as server_crud
from ..utils import admin_required, format_message

async def start_admin(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin start command handler"""
    if not update.effective_user or update.effective_user.id not in settings.ADMIN_IDS:
        await update.message.reply_text("⛔️ شما دسترسی ادمین ندارید.")
        return
    
    message = """
🎯 پنل مدیریت ربات

دستورات موجود:
/users - مدیریت کاربران
/servers - مدیریت سرورها
/stats - آمار کلی
/broadcast - ارسال پیام به همه کاربران
"""
    await update.message.reply_text(message)

@admin_required
async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send message to all users"""
    if not context.args:
        await update.message.reply_text("❌ لطفا متن پیام را وارد کنید.")
        return
    
    message = " ".join(context.args)
    users = await user_crud.get_all_users()
    success = 0
    failed = 0
    
    for user in users:
        try:
            await context.bot.send_message(chat_id=user.telegram_id, text=message)
            success += 1
        except Exception:
            failed += 1
    
    await update.message.reply_text(
        f"✅ پیام با موفقیت ارسال شد\n"
        f"موفق: {success}\n"
        f"ناموفق: {failed}"
    )

@admin_required
async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show system statistics"""
    total_users = await user_crud.count_users()
    active_users = await user_crud.count_active_users()
    total_servers = await server_crud.count_servers()
    active_servers = await server_crud.count_active_servers()
    
    message = format_message(
        "📊 آمار سیستم\n\n"
        f"👥 کل کاربران: {total_users}\n"
        f"✅ کاربران فعال: {active_users}\n"
        f"🖥 کل سرورها: {total_servers}\n"
        f"🟢 سرورهای فعال: {active_servers}"
    )
    
    await update.message.reply_text(message)

def register_admin_handlers(application):
    """Register admin command handlers"""
    application.add_handler(CommandHandler("admin", start_admin))
    application.add_handler(CommandHandler("broadcast", broadcast))
    application.add_handler(CommandHandler("stats", stats)) 