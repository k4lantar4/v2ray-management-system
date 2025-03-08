"""
User command handlers for the Telegram bot
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, CallbackQueryHandler, ContextTypes, filters
from ...core.config import settings
from ...db.crud import user as user_crud
from ...db.crud import subscription as sub_crud
from ..utils import user_required, format_message

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start command handler"""
    if not update.effective_user:
        return
        
    user = await user_crud.get_user_by_telegram_id(update.effective_user.id)
    if not user:
        user = await user_crud.create_user(
            telegram_id=update.effective_user.id,
            username=update.effective_user.username,
            first_name=update.effective_user.first_name,
            last_name=update.effective_user.last_name
        )
    
    keyboard = [
        [
            InlineKeyboardButton("🔑 سرویس های من", callback_data="my_services"),
            InlineKeyboardButton("💰 شارژ حساب", callback_data="add_credit")
        ],
        [
            InlineKeyboardButton("📊 آمار مصرف", callback_data="usage_stats"),
            InlineKeyboardButton("❓ راهنما", callback_data="help")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = f"""
👋 {user.first_name} عزیز، خوش آمدید

🎯 با این ربات می‌توانید:
• سرویس‌های V2Ray خود را مدیریت کنید
• آمار مصرف خود را ببینید
• حساب خود را شارژ کنید
• سرویس جدید تهیه کنید

برای شروع یکی از گزینه‌های زیر را انتخاب کنید:
"""
    
    await update.message.reply_text(message, reply_markup=reply_markup)

@user_required
async def my_services(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user's active services"""
    user = await user_crud.get_user_by_telegram_id(update.effective_user.id)
    subs = await sub_crud.get_user_subscriptions(user.id)
    
    if not subs:
        await update.message.reply_text("❌ شما هیچ سرویس فعالی ندارید.")
        return
        
    message = "🔑 سرویس‌های فعال شما:\n\n"
    for sub in subs:
        message += format_message(
            f"📌 نام: {sub.name}\n"
            f"⏱ تاریخ انقضا: {sub.expire_date}\n"
            f"📊 حجم باقیمانده: {sub.remaining_traffic} GB\n"
            "〰️〰️〰️〰️〰️〰️〰️〰️\n"
        )
    
    await update.message.reply_text(message)

@user_required
async def usage_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user's usage statistics"""
    user = await user_crud.get_user_by_telegram_id(update.effective_user.id)
    stats = await user_crud.get_user_stats(user.id)
    
    message = format_message(
        "📊 آمار مصرف شما\n\n"
        f"💰 اعتبار: {stats['credit']} تومان\n"
        f"📥 دانلود: {stats['download']} GB\n"
        f"📤 آپلود: {stats['upload']} GB\n"
        f"🕐 سرویس‌های فعال: {stats['active_services']}"
    )
    
    await update.message.reply_text(message)

def register_user_handlers(application):
    """Register user command handlers"""
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("services", my_services))
    application.add_handler(CommandHandler("stats", usage_stats))
    application.add_handler(CallbackQueryHandler(my_services, pattern="^my_services$"))
    application.add_handler(CallbackQueryHandler(usage_stats, pattern="^usage_stats$")) 