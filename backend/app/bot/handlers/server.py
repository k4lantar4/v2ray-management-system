"""
Server management handlers for the Telegram bot
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, CallbackQueryHandler, ContextTypes, filters
from ...core.config import settings
from ...db.crud import server as server_crud
from ..utils import admin_required, format_message

@admin_required
async def list_servers(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List all servers"""
    servers = await server_crud.get_all_servers()
    
    if not servers:
        await update.message.reply_text("❌ هیچ سروری ثبت نشده است.")
        return
        
    message = "🖥 لیست سرورها:\n\n"
    for server in servers:
        status = "🟢" if server.is_active else "🔴"
        message += format_message(
            f"{status} نام: {server.name}\n"
            f"📍 آدرس: {server.host}\n"
            f"👥 کاربران فعال: {server.active_users}\n"
            f"📊 بار سرور: {server.load}%\n"
            "〰️〰️〰️〰️〰️〰️〰️〰️\n"
        )
    
    keyboard = [
        [
            InlineKeyboardButton("➕ افزودن سرور", callback_data="add_server"),
            InlineKeyboardButton("✏️ ویرایش سرور", callback_data="edit_server")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup)

@admin_required
async def server_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show server statistics"""
    if not context.args:
        await update.message.reply_text("❌ لطفا نام سرور را وارد کنید.")
        return
        
    server_name = context.args[0]
    server = await server_crud.get_server_by_name(server_name)
    
    if not server:
        await update.message.reply_text("❌ سرور مورد نظر یافت نشد.")
        return
        
    stats = await server_crud.get_server_stats(server.id)
    
    message = format_message(
        f"📊 آمار سرور {server.name}\n\n"
        f"👥 کاربران فعال: {stats['active_users']}\n"
        f"📥 دانلود کل: {stats['total_download']} GB\n"
        f"📤 آپلود کل: {stats['total_upload']} GB\n"
        f"🔄 پهنای باند مصرفی: {stats['bandwidth_usage']} Mbps\n"
        f"💾 مصرف CPU: {stats['cpu_usage']}%\n"
        f"💿 مصرف RAM: {stats['ram_usage']}%"
    )
    
    await update.message.reply_text(message)

@admin_required
async def add_server(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Add new server handler"""
    # This is a placeholder. The actual implementation would use conversation handlers
    # to collect server details step by step
    await update.message.reply_text(
        "➕ برای افزودن سرور جدید، از دستور زیر استفاده کنید:\n\n"
        "/add_server name host port username password"
    )

def register_server_handlers(application):
    """Register server management handlers"""
    application.add_handler(CommandHandler("servers", list_servers))
    application.add_handler(CommandHandler("server_stats", server_stats))
    application.add_handler(CommandHandler("add_server", add_server))
    application.add_handler(CallbackQueryHandler(add_server, pattern="^add_server$")) 