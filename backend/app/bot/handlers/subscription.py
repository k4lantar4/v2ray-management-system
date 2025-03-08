"""
Subscription management handlers for the Telegram bot
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, CallbackQueryHandler, ContextTypes, filters
from ...core.config import settings
from ...db.crud import subscription as sub_crud
from ...db.crud import user as user_crud
from ..utils import user_required, admin_required, format_message

@user_required
async def list_plans(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List available subscription plans"""
    plans = await sub_crud.get_available_plans()
    
    if not plans:
        await update.message.reply_text("❌ در حال حاضر هیچ پلنی موجود نیست.")
        return
        
    message = "📦 پلن‌های موجود:\n\n"
    keyboard = []
    
    for plan in plans:
        message += format_message(
            f"📌 نام: {plan.name}\n"
            f"⏱ مدت: {plan.duration} روز\n"
            f"📊 حجم: {plan.traffic} GB\n"
            f"💰 قیمت: {plan.price} تومان\n"
            "〰️〰️〰️〰️〰️〰️〰️〰️\n"
        )
        keyboard.append([InlineKeyboardButton(
            f"خرید {plan.name}",
            callback_data=f"buy_plan_{plan.id}"
        )])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup)

@user_required
async def buy_plan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle plan purchase"""
    query = update.callback_query
    if not query:
        return
        
    await query.answer()
    
    plan_id = int(query.data.split("_")[-1])
    user = await user_crud.get_user_by_telegram_id(update.effective_user.id)
    plan = await sub_crud.get_plan(plan_id)
    
    if not plan:
        await query.message.reply_text("❌ پلن مورد نظر یافت نشد.")
        return
        
    if user.credit < plan.price:
        await query.message.reply_text(
            "❌ اعتبار شما برای خرید این پلن کافی نیست.\n"
            "لطفا ابتدا حساب خود را شارژ کنید."
        )
        return
        
    subscription = await sub_crud.create_subscription(
        user_id=user.id,
        plan_id=plan.id
    )
    
    await user_crud.update_credit(
        user_id=user.id,
        amount=-plan.price
    )
    
    message = format_message(
        "✅ خرید با موفقیت انجام شد\n\n"
        f"📌 نام پلن: {plan.name}\n"
        f"⏱ مدت اعتبار: {plan.duration} روز\n"
        f"📊 حجم: {plan.traffic} GB\n"
        f"💰 مبلغ پرداخت شده: {plan.price} تومان\n\n"
        "🔑 کانفیگ شما به زودی ارسال خواهد شد."
    )
    
    await query.message.reply_text(message)

@admin_required
async def add_plan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Add new subscription plan"""
    # This is a placeholder. The actual implementation would use conversation handlers
    # to collect plan details step by step
    await update.message.reply_text(
        "➕ برای افزودن پلن جدید، از دستور زیر استفاده کنید:\n\n"
        "/add_plan name duration traffic price"
    )

def register_subscription_handlers(application):
    """Register subscription management handlers"""
    application.add_handler(CommandHandler("plans", list_plans))
    application.add_handler(CommandHandler("add_plan", add_plan))
    application.add_handler(CallbackQueryHandler(buy_plan, pattern="^buy_plan_")) 