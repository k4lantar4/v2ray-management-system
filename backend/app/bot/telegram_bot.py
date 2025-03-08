"""
Main Telegram bot module
"""

import logging
import asyncio
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes
from ..core.config import settings
from .handlers import register_all_handlers

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize the bot
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
application = None

# Command to manage users
async def manage_users(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Logic to manage users
    await update.message.reply_text("User management functionality here.")

# Command to manage subscriptions
async def manage_subscriptions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Logic to manage subscriptions
    await update.message.reply_text("Subscription management functionality here.")

# Command to manage payments
async def manage_payments(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Logic to manage payments
    await update.message.reply_text("Payment management functionality here.")

# Function to send messages to users
async def send_message(chat_id: int, text: str) -> None:
    """
    Send a message to a specific chat ID.
    
    Args:
        chat_id: The Telegram chat ID to send the message to
        text: The message text to send
    """
    try:
        await bot.send_message(chat_id=chat_id, text=text)
        logger.info(f"✅ Message sent to {chat_id}")
    except Exception as e:
        logger.error(f"❌ Failed to send message to {chat_id}: {str(e)}")
        raise

# Function to initialize and start the bot
async def start_bot():
    """Initialize and start the Telegram bot"""
    global application
    
    try:
        # Create application
        application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
        
        # Register all handlers
        register_all_handlers(application)
        
        # Start the bot
        await application.initialize()
        await application.start()
        
        logger.info("✅ Telegram bot started successfully")
        
        return application
        
    except Exception as e:
        logger.error(f"❌ Failed to start Telegram bot: {str(e)}")
        raise

# Function to stop the bot
async def stop_bot():
    """Stop the Telegram bot"""
    global application
    if application:
        try:
            await application.stop()
            logger.info("✅ Telegram bot stopped successfully")
        except Exception as e:
            logger.error(f"❌ Failed to stop Telegram bot: {str(e)}")
            raise

async def broadcast_message(message: str, user_ids: list[int] = None) -> dict:
    """
    Broadcast a message to multiple users.
    
    Args:
        message: The message to broadcast
        user_ids: Optional list of user IDs to send to. If None, sends to all users.
    
    Returns:
        dict: Statistics about the broadcast operation
    """
    from ..db.crud import user as user_crud
    
    try:
        if user_ids is None:
            users = await user_crud.get_all_users()
            user_ids = [user.telegram_id for user in users]
        
        success = 0
        failed = 0
        
        for user_id in user_ids:
            try:
                await send_message(user_id, message)
                success += 1
            except Exception:
                failed += 1
                continue
        
        logger.info(f"✅ Broadcast complete - Success: {success}, Failed: {failed}")
        return {"success": success, "failed": failed}
        
    except Exception as e:
        logger.error(f"❌ Broadcast failed: {str(e)}")
        raise

async def send_config(chat_id: int, config: dict) -> None:
    """
    Send V2Ray configuration to a user.
    
    Args:
        chat_id: The Telegram chat ID to send the config to
        config: The configuration dictionary
    """
    try:
        # Format config as a nice-looking message
        message = (
            "🔑 کانفیگ جدید شما\n\n"
            f"📌 نام: {config['name']}\n"
            f"🌐 سرور: {config['server']}\n"
            f"🔌 پورت: {config['port']}\n"
            f"🔑 پسورد: {config['password']}\n\n"
            "〰️〰️〰️〰️〰️〰️〰️〰️\n"
            f"🔗 لینک اتصال:\n{config['link']}"
        )
        
        await send_message(chat_id, message)
        logger.info(f"✅ Config sent to {chat_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send config to {chat_id}: {str(e)}")
        raise
