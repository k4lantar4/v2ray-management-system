from celery import Celery
from celery.schedules import crontab
from datetime import datetime, timedelta
import logging
from typing import List, Dict
from sqlalchemy import and_

from ..core.config import settings
from ..db.session import get_db
from ..db.models.subscription import Subscription, SubscriptionStatus
from ..db.models.server import Server, ServerStatus, ServerSyncStatus
from ..db.models.user import User, UserRole
from ..services.xui_service import XUIService
from ..services.notification import NotificationService

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    'v2ray_tasks',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    worker_max_tasks_per_child=200,
    worker_prefetch_multiplier=4
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    'monitor-subscriptions': {
        'task': 'tasks.monitor_subscriptions',
        'schedule': crontab(minute='*/15')  # Every 15 minutes
    },
    'sync-servers': {
        'task': 'tasks.sync_servers',
        'schedule': crontab(minute='*/5')  # Every 5 minutes
    },
    'send-expiry-notifications': {
        'task': 'tasks.send_expiry_notifications',
        'schedule': crontab(hour='9', minute='0')  # Daily at 9 AM
    },
    'check-server-health': {
        'task': 'tasks.check_server_health',
        'schedule': crontab(minute='*/10')  # Every 10 minutes
    },
    'process-auto-renewals': {
        'task': 'tasks.process_auto_renewals',
        'schedule': crontab(hour='0', minute='0')  # Daily at midnight
    },
    'send-promotional-offers': {
        'task': 'tasks.send_promotional_offers',
        'schedule': crontab(hour='14', minute='0')  # Daily at 2 PM
    }
}

@celery_app.task(name='tasks.monitor_subscriptions')
async def monitor_subscriptions():
    """Monitor subscription status and usage"""
    try:
        async with get_db() as db:
            # Get active subscriptions
            subscriptions = await db.query(Subscription).filter(
                Subscription.status == SubscriptionStatus.ACTIVE
            ).all()
            
            notification_service = NotificationService()
            
            for subscription in subscriptions:
                try:
                    # Get server and XUI service
                    server = subscription.server
                    xui = XUIService(server)
                    
                    # Check usage statistics
                    stats = await xui.get_client_stats(subscription.xui_uuid)
                    
                    # Update usage data
                    subscription.data_used = stats['total'] / (1024 * 1024 * 1024)  # Convert to GB
                    
                    # Check if subscription has expired
                    if datetime.utcnow() > subscription.end_date:
                        subscription.status = SubscriptionStatus.EXPIRED
                        await notification_service.notify_subscription_expiry(subscription)
                    
                    # Check if data limit exceeded
                    elif subscription.data_used >= subscription.data_limit:
                        subscription.status = SubscriptionStatus.SUSPENDED
                        await notification_service.notify_data_usage(subscription, 100)
                    
                    # Notify if close to data limit
                    else:
                        usage_percent = (subscription.data_used / subscription.data_limit) * 100
                        if usage_percent >= 90:
                            await notification_service.notify_data_usage(
                                subscription,
                                usage_percent
                            )
                    
                    await db.commit()
                    
                except Exception as e:
                    logger.error(
                        f"Error monitoring subscription {subscription.id}: {str(e)}"
                    )
                    continue
    
    except Exception as e:
        logger.error(f"Error in subscription monitoring task: {str(e)}")

@celery_app.task(name='tasks.sync_servers')
async def sync_servers():
    """Synchronize server status and metrics with enhanced monitoring"""
    try:
        async with get_db() as db:
            servers = await db.query(Server).all()
            
            # Sync servers and record metrics
            results = await XUIService.sync_all_servers(servers, db)
            
            # Analyze metrics for alerts
            for server in servers:
                try:
                    # Get recent metrics
                    metrics = await server.get_metrics_history(db, hours=1)
                    if not metrics:
                        continue
                        
                    # Calculate metrics trends
                    avg_metrics = await server.get_average_metrics(db, hours=1)
                    
                    notification_service = NotificationService()
                    alerts = []
                    
                    # Check for concerning trends
                    if avg_metrics["avg_cpu"] > 85:
                        alerts.append(f"Sustained high CPU usage: {avg_metrics['avg_cpu']:.1f}%")
                    
                    if avg_metrics["avg_memory"] > 85:
                        alerts.append(f"Sustained high memory usage: {avg_metrics['avg_memory']:.1f}%")
                    
                    if avg_metrics["avg_response_time"] and avg_metrics["avg_response_time"] > 1000:
                        alerts.append(f"High average response time: {avg_metrics['avg_response_time']:.0f}ms")
                    
                    # Check for failed login patterns
                    if server.failed_login_attempts >= 5:
                        alerts.append(f"Multiple failed login attempts: {server.failed_login_attempts}")
                    
                    # Send alerts if needed
                    if alerts:
                        await notification_service.send_system_alert(
                            "server_performance_warning",
                            {
                                "server_id": server.id,
                                "server_name": server.name,
                                "alerts": alerts,
                                "metrics": avg_metrics
                            }
                        )
                
                except Exception as e:
                    logger.error(f"Error analyzing metrics for server {server.id}: {str(e)}")
                    continue
            
            # Log sync summary
            success_count = len(results["success"])
            failed_count = len(results["failed"])
            logger.info(
                f"Server sync completed: {success_count} succeeded, {failed_count} failed"
            )
            
            if failed_count > 0:
                logger.warning(
                    f"Failed servers: {[f['server_id'] for f in results['failed']]}"
                )
    
    except Exception as e:
        logger.error(f"Error in server sync task: {str(e)}")

@celery_app.task(name='tasks.check_server_health')
async def check_server_health():
    """Monitor server health and performance"""
    try:
        async with get_db() as db:
            servers = await db.query(Server).all()
            notification_service = NotificationService()
            
            for server in servers:
                try:
                    xui = XUIService(server)
                    stats = await xui.get_server_stats(db)  # Pass db to record metrics
                    
                    # Check critical metrics
                    alerts = []
                    
                    if stats["cpu_usage"] > 90:
                        alerts.append(f"High CPU usage: {stats['cpu_usage']}%")
                    
                    if stats["memory_usage"] > 90:
                        alerts.append(f"High memory usage: {stats['memory_usage']}%")
                    
                    if stats["disk_usage"] > 95:
                        alerts.append(f"Critical disk usage: {stats['disk_usage']}%")
                    
                    if any(load > 10 for load in stats["load_avg"]):
                        alerts.append(f"High load average: {stats['load_avg']}")
                    
                    if alerts:
                        await notification_service.send_system_alert(
                            "server_health_warning",
                            {
                                "server_id": server.id,
                                "alerts": alerts,
                                "stats": stats
                            }
                        )
                
                except Exception as e:
                    logger.error(f"Error checking server {server.id} health: {str(e)}")
                    continue
    
    except Exception as e:
        logger.error(f"Error in server health check task: {str(e)}")

@celery_app.task(name='tasks.process_auto_renewals')
async def process_auto_renewals():
    """Process automatic subscription renewals"""
    try:
        async with get_db() as db:
            # Get subscriptions expiring in next 24 hours with auto-renew enabled
            tomorrow = datetime.utcnow() + timedelta(days=1)
            subscriptions = await db.query(Subscription).filter(
                and_(
                    Subscription.end_date <= tomorrow,
                    Subscription.auto_renew == True,
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            ).all()
            
            notification_service = NotificationService()
            
            for subscription in subscriptions:
                try:
                    user = subscription.user
                    
                    # Check if user has sufficient wallet balance
                    if user.wallet_balance >= subscription.price:
                        # Process renewal
                        user.wallet_balance -= subscription.price
                        subscription.end_date += timedelta(days=30)  # Add 30 days
                        subscription.data_used = 0  # Reset data usage
                        
                        # Update V2Ray account
                        xui = XUIService(subscription.server)
                        await xui.update_client(
                            subscription,
                            subscription.xui_uuid
                        )
                        
                        await notification_service.send_message(
                            user.telegram_id,
                            f"""
✅ تمدید خودکار اشتراک انجام شد!

📱 مشخصات جدید:
• تاریخ پایان: {subscription.end_date.strftime('%Y-%m-%d')}
• حجم باقیمانده: {subscription.data_limit} GB
💰 موجودی کیف پول: {user.wallet_balance:,} تومان
"""
                        )
                    else:
                        # Notify insufficient balance
                        await notification_service.send_message(
                            user.telegram_id,
                            f"""
⚠️ تمدید خودکار اشتراک ناموفق بود!

💰 موجودی کیف پول کافی نیست
• موجودی فعلی: {user.wallet_balance:,} تومان
• مبلغ مورد نیاز: {subscription.price:,} تومان

لطفاً کیف پول خود را شارژ کنید:
/charge
"""
                        )
                    
                    await db.commit()
                
                except Exception as e:
                    logger.error(
                        f"Error processing auto-renewal for subscription {subscription.id}: {str(e)}"
                    )
                    continue
    
    except Exception as e:
        logger.error(f"Error in auto-renewal task: {str(e)}")

@celery_app.task(name='tasks.send_promotional_offers')
async def send_promotional_offers():
    """Send targeted promotional offers to users"""
    try:
        async with get_db() as db:
            notification_service = NotificationService()
            
            # Get users without active subscriptions
            inactive_users = await db.query(User).filter(
                and_(
                    ~User.subscriptions.any(
                        Subscription.status == SubscriptionStatus.ACTIVE
                    ),
                    User.status == "active"
                )
            ).all()
            
            # Special offer for inactive users
            for user in inactive_users:
                await notification_service.send_message(
                    user.telegram_id,
                    """
🎁 پیشنهاد ویژه برای شما!

💫 30% تخفیف در اولین خرید
⭐️ اشتراک یک ماهه + 10GB ترافیک هدیه

برای مشاهده پلن‌های ویژه:
/buy
"""
                )
            
            # VIP offers for eligible users
            regular_users = await db.query(User).filter(
                and_(
                    User.role == UserRole.USER,
                    User.subscriptions.any(
                        Subscription.status == SubscriptionStatus.ACTIVE
                    )
                )
            ).all()
            
            for user in regular_users:
                await notification_service.send_vip_offer(user)
            
            await db.commit()
    
    except Exception as e:
        logger.error(f"Error in promotional offers task: {str(e)}")

if __name__ == '__main__':
    celery_app.start()
