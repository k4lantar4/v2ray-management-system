import logging
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import asyncio
from telegram import Bot, ParseMode
import json

from ..core.config import settings
from ..db.models.user import User, UserRole
from ..db.models.subscription import Subscription, SubscriptionStatus
from ..db.models.payment import Payment, PaymentStatus

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for handling all notifications and alerts"""
    
    def __init__(self):
        self.bot = Bot(settings.TELEGRAM_BOT_TOKEN)
        self.admin_group_id = settings.ADMIN_GROUP_ID
        self.payment_channel_id = settings.PAYMENT_CHANNEL_ID
        self.notification_cooldown = 3600  # 1 hour in seconds
        self.last_notifications = {}  # Track last notification time per user
    
    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = ParseMode.HTML,
        reply_markup: Optional[Dict] = None
    ) -> bool:
        """Send message with retry logic"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                await self.bot.send_message(
                    chat_id=chat_id,
                    text=text,
                    parse_mode=parse_mode,
                    reply_markup=reply_markup
                )
                return True
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Failed to send message to {chat_id}: {str(e)}")
                    return False
                await asyncio.sleep(retry_delay)
    
    async def notify_subscription_expiry(self, subscription: Subscription):
        """Notify user about subscription expiry"""
        if not self._should_notify(subscription.user_id, "expiry"):
            return
            
        days_left = (subscription.end_date - datetime.utcnow()).days
        
        if days_left <= 0:
            message = f"""
⚠️ اشتراک شما منقضی شده است!

📱 مشخصات اشتراک:
🔹 شناسه: {subscription.id}
🔹 تاریخ پایان: {subscription.end_date.strftime('%Y-%m-%d')}

برای تمدید اشتراک از دستور /renew استفاده کنید.
"""
        elif days_left <= 3:
            message = f"""
⚠️ اشتراک شما به زودی منقضی می‌شود!

📱 مشخصات اشتراک:
🔹 شناسه: {subscription.id}
🔹 زمان باقی‌مانده: {days_left} روز
🔹 تاریخ پایان: {subscription.end_date.strftime('%Y-%m-%d')}

🎁 تمدید زودهنگام = 10% تخفیف
برای تمدید از دستور /renew استفاده کنید.
"""
        else:
            return
            
        await self.send_message(subscription.user.telegram_id, message)
        self._update_notification_time(subscription.user_id, "expiry")
    
    async def notify_data_usage(self, subscription: Subscription, usage_percent: float):
        """Notify user about data usage"""
        if not self._should_notify(subscription.user_id, "usage"):
            return
            
        if usage_percent >= 90:
            message = f"""
⚠️ حجم اشتراک شما رو به اتمام است!

📊 وضعیت مصرف:
🔹 حجم کل: {subscription.data_limit} GB
🔹 مصرف شده: {subscription.data_used} GB
🔹 باقی‌مانده: {subscription.data_limit - subscription.data_used} GB
🔹 درصد مصرف: {usage_percent:.1f}%

برای خرید حجم اضافه از دستور /buy_data استفاده کنید.
"""
            await self.send_message(subscription.user.telegram_id, message)
            self._update_notification_time(subscription.user_id, "usage")
    
    async def notify_payment_received(self, payment: Payment):
        """Notify admins about new payment"""
        message = f"""
💰 پرداخت جدید دریافت شد!

👤 کاربر: {payment.user.full_name or payment.user.phone}
💳 مبلغ: {payment.amount:,} تومان
🔖 شناسه تراکنش: {payment.transaction_id}
📅 تاریخ: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

✅ تأیید: /approve_{payment.id}
❌ رد: /reject_{payment.id}
"""
        await self.send_message(self.admin_group_id, message)
        
        if payment.status == PaymentStatus.COMPLETED:
            await self.send_message(
                self.payment_channel_id,
                f"""
💫 تراکنش موفق:
💰 مبلغ: {payment.amount:,} تومان
📅 تاریخ: {datetime.utcnow().strftime('%Y-%m-%d')}
"""
            )
    
    async def notify_server_status(self, server_id: int, status: str, metrics: Dict):
        """Notify admins about server status changes"""
        message = f"""
🖥️ تغییر وضعیت سرور #{server_id}

📊 وضعیت: {status}
🔄 زمان: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

📈 متریک‌ها:
• CPU: {metrics['cpu_usage']}%
• RAM: {metrics['memory_usage']}%
• Disk: {metrics['disk_usage']}%
• Network ↑: {metrics['network_out'] / 1024 / 1024:.1f} MB
• Network ↓: {metrics['network_in'] / 1024 / 1024:.1f} MB
• Active Users: {metrics['active_connections']}

⚡️ Load Average: {', '.join(map(str, metrics['load_avg']))}
"""
        await self.send_message(self.admin_group_id, message)
    
    async def send_promotional_message(
        self,
        users: List[User],
        message: str,
        exclude_roles: List[UserRole] = None
    ):
        """Send promotional message to users"""
        exclude_roles = exclude_roles or []
        success_count = 0
        fail_count = 0
        
        for user in users:
            if user.role in exclude_roles:
                continue
                
            if await self.send_message(user.telegram_id, message):
                success_count += 1
            else:
                fail_count += 1
            await asyncio.sleep(0.1)  # Rate limiting
            
        await self.send_message(
            self.admin_group_id,
            f"""
📢 نتیجه ارسال پیام تبلیغاتی:
✅ موفق: {success_count}
❌ ناموفق: {fail_count}
📅 زمان: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
"""
        )
    
    async def send_vip_offer(self, user: User):
        """Send VIP upgrade offer to eligible users"""
        if not self._should_notify(user.id, "vip_offer"):
            return
            
        message = f"""
🌟 پیشنهاد ویژه VIP برای شما!

با ارتقا به VIP از مزایای ویژه بهره‌مند شوید:
• 15% تخفیف در تمام خریدها
• اولویت در پشتیبانی
• تغییر سرور نامحدود
• هدیه 10GB ترافیک ماهانه

🎁 برای ارتقا به VIP از دستور /upgrade_vip استفاده کنید.
"""
        await self.send_message(user.telegram_id, message)
        self._update_notification_time(user.id, "vip_offer")
    
    def _should_notify(self, user_id: int, notification_type: str) -> bool:
        """Check if enough time has passed since last notification"""
        key = f"{user_id}_{notification_type}"
        last_time = self.last_notifications.get(key, 0)
        return (datetime.utcnow().timestamp() - last_time) > self.notification_cooldown
    
    def _update_notification_time(self, user_id: int, notification_type: str):
        """Update last notification time"""
        key = f"{user_id}_{notification_type}"
        self.last_notifications[key] = datetime.utcnow().timestamp()
    
    async def send_system_alert(self, alert_type: str, details: Dict):
        """Send system alerts to admins"""
        message = f"""
🚨 هشدار سیستم!

نوع: {alert_type}
زمان: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

📝 جزئیات:
{json.dumps(details, indent=2, ensure_ascii=False)}
"""
        await self.send_message(self.admin_group_id, message)
    
    async def send_daily_report(self):
        """Send daily statistics to admin group"""
        # TODO: Implement daily statistics gathering
        pass
