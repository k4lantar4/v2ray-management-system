# 🤖 ربات مدیریت و فروش اکانت V2Ray
# 📅 نسخه: 7.0
# 📌 آخرین بروزرسانی: 6 مارس 2025

import re
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ParseMode
from telegram.ext import (
    Updater, CommandHandler, CallbackQueryHandler, 
    MessageHandler, Filters, CallbackContext
)

from ..core.config import settings
from ..db.session import get_db
from ..db.models.user import User, UserRole, UserStatus
from ..db.models.subscription import Subscription, SubscriptionStatus
from ..db.models.payment import Payment, PaymentStatus, PaymentMethod, PaymentType
from ..db.models.server import Server, ServerStatus
from ..services.xui_service import XUIService
from ..services.notification import NotificationService

# ⚙️ تنظیمات لاگ
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class V2RayBot:
    def __init__(self):
        """Initialize bot with required services"""
        self.updater = Updater(settings.TELEGRAM_BOT_TOKEN)
        self.dp = self.updater.dispatcher
        self.notification_service = NotificationService()
        
        # Setup command handlers
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup all command and message handlers"""
        # Basic commands
        self.dp.add_handler(CommandHandler("start", self.start))
        self.dp.add_handler(CommandHandler("help", self.help_command))
        
        # Account management
        self.dp.add_handler(CommandHandler("register", self.register))
        self.dp.add_handler(CommandHandler("profile", self.show_profile))
        self.dp.add_handler(CommandHandler("buy", self.show_plans))
        
        # Subscription management
        self.dp.add_handler(CommandHandler("my_subscriptions", self.show_subscriptions))
        self.dp.add_handler(CommandHandler("change_server", self.change_server))
        self.dp.add_handler(CommandHandler("renew", self.renew_subscription))
        
        # Payment handlers
        self.dp.add_handler(CommandHandler("wallet", self.show_wallet))
        self.dp.add_handler(CommandHandler("charge", self.charge_wallet))
        
        # VIP & Seller features
        self.dp.add_handler(CommandHandler("vip_status", self.show_vip_status))
        self.dp.add_handler(CommandHandler("seller_panel", self.show_seller_panel))
        
        # Support
        self.dp.add_handler(CommandHandler("support", self.contact_support))
        
        # Callback queries
        self.dp.add_handler(CallbackQueryHandler(self.handle_callback))
        
        # Message handlers
        self.dp.add_handler(MessageHandler(
            Filters.regex(r'^\+98\d{10}$'),
            self.handle_phone_number
        ))
        self.dp.add_handler(MessageHandler(
            Filters.photo & ~Filters.command,
            self.handle_receipt
        ))

    async def start(self, update: Update, context: CallbackContext):
        """Handle /start command"""
        welcome_message = """
✨ به ربات VIP خوش آمدید! 🌟

🔐 سرویس‌های V2Ray با کیفیت عالی:
• سرعت بالا و پایداری عالی
• پشتیبانی 24/7
• تغییر سرور نامحدود
• تضمین بازگشت وجه

📱 برای شروع، لطفاً شماره موبایل خود را با فرمت زیر ارسال کنید:
+98xxxxxxxxxx

⚡️ ویژگی‌های منحصر به فرد:
• تمدید خودکار اشتراک
• کیف پول هوشمند
• سیستم VIP با تخفیف‌های ویژه
• امکان کسب درآمد به عنوان فروشنده
"""
        keyboard = [
            [InlineKeyboardButton("📱 ثبت شماره موبایل", callback_data="register")],
            [InlineKeyboardButton("💰 تعرفه‌ها", callback_data="plans")],
            [InlineKeyboardButton("❓ راهنما", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(welcome_message, reply_markup=reply_markup)

    async def validate_phone(self, phone: str) -> bool:
        """Validate Iranian phone number"""
        pattern = r'^\+98[0-9]{10}$'
        return bool(re.match(pattern, phone))

    async def handle_phone_number(self, update: Update, context: CallbackContext):
        """Handle phone number registration"""
        phone = update.message.text
        if not await self.validate_phone(phone):
            await update.message.reply_text(
                "❌ شماره موبایل نامعتبر است. لطفاً با فرمت +98XXXXXXXXXX وارد کنید."
            )
            return

        async with get_db() as db:
            user = await User.get_by_phone(db, phone)
            if user:
                if user.telegram_id != update.effective_user.id:
                    await update.message.reply_text(
                        "❌ این شماره قبلاً ثبت شده است."
                    )
                    return
            else:
                user = User(
                    phone=phone,
                    telegram_id=update.effective_user.id,
                    status=UserStatus.ACTIVE
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

            await update.message.reply_text(
                "✅ ثبت‌نام شما با موفقیت انجام شد!\n\n"
                "🎁 برای مشاهده پلن‌های ویژه: /buy\n"
                "💰 برای شارژ کیف پول: /wallet"
            )

    async def show_plans(self, update: Update, context: CallbackContext):
        """Show available subscription plans"""
        plans = [
            {
                "name": "پلن برنزی",
                "duration": 30,
                "data": 100,
                "price": 120000,
                "id": "bronze"
            },
            {
                "name": "پلن نقره‌ای",
                "duration": 90,
                "data": 300,
                "price": 300000,
                "id": "silver"
            },
            {
                "name": "پلن طلایی",
                "duration": 180,
                "data": 600,
                "price": 500000,
                "id": "gold"
            }
        ]

        message = "🎁 پلن‌های اشتراک:\n\n"
        keyboard = []

        async with get_db() as db:
            user = await User.get_by_telegram_id(db, update.effective_user.id)
            is_vip = user and user.role == UserRole.VIP

        for plan in plans:
            price = plan["price"]
            if is_vip:
                discount = price * (settings.VIP_DISCOUNT_PERCENT / 100)
                price -= discount
                vip_text = f"(شامل {settings.VIP_DISCOUNT_PERCENT}% تخفیف VIP)"
            else:
                vip_text = ""

            message += (
                f"📱 {plan['name']}\n"
                f"⏰ مدت: {plan['duration']} روز\n"
                f"💾 حجم: {plan['data']} گیگابایت\n"
                f"💰 قیمت: {price:,} تومان {vip_text}\n\n"
            )

            keyboard.append([
                InlineKeyboardButton(
                    f"خرید {plan['name']}", 
                    callback_data=f"buy_plan_{plan['id']}"
                )
            ])

        keyboard.append([
            InlineKeyboardButton("💰 شارژ کیف پول", callback_data="charge_wallet")
        ])

        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(message, reply_markup=reply_markup)

    async def handle_payment(self, update: Update, context: CallbackContext):
        """Process payment for subscription"""
        query = update.callback_query
        plan_id = query.data.split('_')[2]

        async with get_db() as db:
            user = await User.get_by_telegram_id(db, update.effective_user.id)
            if not user:
                await query.answer("❌ لطفاً ابتدا ثبت‌نام کنید.")
                return

            # Create payment record
            payment = Payment(
                user_id=user.id,
                amount=self._get_plan_price(plan_id),
                payment_method=PaymentMethod.CARD,
                payment_type=PaymentType.SUBSCRIPTION,
                status=PaymentStatus.PENDING
            )
            db.add(payment)
            await db.commit()

            # Show payment instructions
            message = f"""
💳 اطلاعات پرداخت:

🏦 شماره کارت: {settings.BANK_CARDS[0]}
👤 به نام: {settings.BANK_ACCOUNT_NAME}
💰 مبلغ: {payment.amount:,} تومان
🔖 کد پیگیری: {payment.id}

⚠️ پس از واریز:
1️⃣ تصویر رسید را ارسال کنید
2️⃣ منتظر تأیید بمانید (معمولاً کمتر از 3 دقیقه)
"""
            keyboard = [[
                InlineKeyboardButton("❌ انصراف", callback_data=f"cancel_payment_{payment.id}")
            ]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(message, reply_markup=reply_markup)

    async def handle_receipt(self, update: Update, context: CallbackContext):
        """Handle receipt image upload and verification"""
        async with get_db() as db:
            user = await User.get_by_telegram_id(db, update.effective_user.id)
            if not user:
                await update.message.reply_text("❌ لطفاً ابتدا ثبت‌نام کنید.")
                return

            # Get pending payment
            payment = await Payment.get_pending_by_user(db, user.id)
            if not payment:
                await update.message.reply_text("❌ هیچ پرداخت در انتظار تأییدی یافت نشد.")
                return

            # Save receipt image
            file_id = update.message.photo[-1].file_id
            file = await context.bot.get_file(file_id)
            receipt_path = f"receipts/{payment.id}_{uuid.uuid4()}.jpg"
            await file.download(receipt_path)

            # Update payment record
            payment.receipt_image = receipt_path
            await db.commit()

            # Send receipt to admin group
            admin_message = f"""
📝 رسید پرداخت جدید:

👤 کاربر: {user.full_name or user.phone}
💰 مبلغ: {payment.amount:,} تومان
🔖 کد پیگیری: {payment.id}

✅ تأیید: /approve_{payment.id}
❌ رد: /reject_{payment.id}
"""
            await context.bot.send_photo(
                settings.ADMIN_GROUP_ID,
                photo=open(receipt_path, 'rb'),
                caption=admin_message
            )

            await update.message.reply_text(
                "✅ رسید شما دریافت شد و در حال بررسی است.\n"
                "⏳ لطفاً منتظر تأیید باشید."
            )

    async def create_subscription(
        self,
        user_id: int,
        plan_id: str,
        payment_id: int,
        db: Session
    ) -> Optional[Subscription]:
        """Create new subscription after payment verification"""
        try:
            plan = self._get_plan_details(plan_id)
            server = await Server.get_best_available(db)
            if not server:
                raise Exception("No available servers")

            subscription = Subscription(
                user_id=user_id,
                server_id=server.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=plan["duration"]),
                data_limit=plan["data"],
                price=plan["price"],
                status=SubscriptionStatus.ACTIVE,
                payment_id=payment_id
            )

            # Create V2Ray account
            xui = XUIService(server)
            config = await xui.create_client(subscription)
            subscription.config_data = config["config"]
            subscription.xui_uuid = config["client_id"]

            db.add(subscription)
            await db.commit()
            await db.refresh(subscription)

            return subscription

        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            return None

    def run(self):
        """Start the bot"""
        self.updater.start_polling()
        logger.info("🤖 Bot started successfully!")
        self.updater.idle()

# 🚀 Initialize and run bot
if __name__ == "__main__":
    bot = V2RayBot()
    bot.run()
