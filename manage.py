#!/usr/bin/env python3
"""
🛠️ Management Script for V2Ray Management System
Provides CLI commands for common management tasks
"""

import argparse
import asyncio
import logging
import sys
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta

sys.path.append(".")  # Add current directory to path

from backend.app.db.session import get_db
from backend.app.db.models.user import User, UserRole, UserStatus
from backend.app.db.models.subscription import Subscription, SubscriptionStatus
from backend.app.db.models.server import Server, ServerStatus
from backend.app.services.xui_service import XUIService
from backend.scripts.create_admin import create_admin
from backend.scripts.init_db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CommandManager:
    """Management command handler"""
    
    @staticmethod
    async def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
        """Run the FastAPI server"""
        print("🚀 Starting FastAPI server...")
        uvicorn.run(
            "backend.app.main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )

    @staticmethod
    async def run_bot():
        """Run the Telegram bot"""
        print("🤖 Starting Telegram bot...")
        from backend.app.bot.telegram_bot import V2RayBot
        bot = V2RayBot()
        bot.run()

    @staticmethod
    async def sync_servers():
        """Synchronize all servers with 3x-ui panels"""
        print("🔄 Syncing servers...")
        async with get_db() as db:
            servers = await db.query(Server).all()
            results = await XUIService.sync_all_servers(servers)
            
            print("\n📊 Sync Results:")
            print("✅ Successful syncs:")
            for success in results["success"]:
                print(f"  • Server #{success['server_id']}: {success['status']}")
                
            if results["failed"]:
                print("\n❌ Failed syncs:")
                for failure in results["failed"]:
                    print(f"  • Server #{failure['server_id']}: {failure['error']}")

    @staticmethod
    async def list_users(role: Optional[str] = None, status: Optional[str] = None):
        """List users with optional filtering"""
        print("👥 Listing users...")
        async with get_db() as db:
            query = db.query(User)
            
            if role:
                query = query.filter(User.role == UserRole(role))
            if status:
                query = query.filter(User.status == UserStatus(status))
                
            users = await query.all()
            
            print("\n📋 User List:")
            print("=" * 50)
            for user in users:
                print(f"""
👤 {user.full_name or 'N/A'}
• ID: {user.id}
• Phone: {user.phone}
• Role: {user.role}
• Status: {user.status}
• Wallet: {user.wallet_balance:,} Toman
• Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}
""")
            print(f"\nTotal users: {len(users)}")

    @staticmethod
    async def list_subscriptions(status: Optional[str] = None):
        """List subscriptions with optional filtering"""
        print("📱 Listing subscriptions...")
        async with get_db() as db:
            query = db.query(Subscription)
            
            if status:
                query = query.filter(Subscription.status == SubscriptionStatus(status))
                
            subscriptions = await query.all()
            
            print("\n📋 Subscription List:")
            print("=" * 50)
            for sub in subscriptions:
                print(f"""
📱 Subscription #{sub.id}
• User: {sub.user.full_name or sub.user.phone}
• Server: {sub.server.name}
• Status: {sub.status}
• Data: {sub.data_used}/{sub.data_limit} GB
• Valid until: {sub.end_date.strftime('%Y-%m-%d')}
• Auto-renew: {'Yes' if sub.auto_renew else 'No'}
""")
            print(f"\nTotal subscriptions: {len(subscriptions)}")

    @staticmethod
    async def cleanup_expired():
        """Clean up expired subscriptions and inactive users"""
        print("🧹 Starting cleanup...")
        async with get_db() as db:
            # Clean up expired subscriptions
            expired = await db.query(Subscription).filter(
                Subscription.end_date < datetime.utcnow(),
                Subscription.status != SubscriptionStatus.EXPIRED
            ).all()
            
            for sub in expired:
                sub.status = SubscriptionStatus.EXPIRED
                print(f"📱 Marked subscription #{sub.id} as expired")
            
            # Clean up inactive users
            month_ago = datetime.utcnow() - timedelta(days=30)
            inactive = await db.query(User).filter(
                User.last_login < month_ago,
                User.status == UserStatus.ACTIVE,
                User.role == UserRole.USER
            ).all()
            
            for user in inactive:
                user.status = UserStatus.INACTIVE
                print(f"👤 Marked user #{user.id} as inactive")
            
            await db.commit()
            print(f"\n✅ Cleanup completed: {len(expired)} subscriptions, {len(inactive)} users")

def main():
    """Main CLI handler"""
    parser = argparse.ArgumentParser(description="V2Ray Management System CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Server command
    server_parser = subparsers.add_parser("server", help="Run FastAPI server")
    server_parser.add_argument("--host", default="0.0.0.0", help="Host to bind")
    server_parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    server_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    # Bot command
    subparsers.add_parser("bot", help="Run Telegram bot")

    # Init command
    subparsers.add_parser("init", help="Initialize database")

    # Admin command
    subparsers.add_parser("create-admin", help="Create admin user")

    # Sync command
    subparsers.add_parser("sync", help="Sync servers with 3x-ui panels")

    # Users command
    users_parser = subparsers.add_parser("users", help="List users")
    users_parser.add_argument("--role", choices=[r.value for r in UserRole], help="Filter by role")
    users_parser.add_argument("--status", choices=[s.value for s in UserStatus], help="Filter by status")

    # Subscriptions command
    subs_parser = subparsers.add_parser("subscriptions", help="List subscriptions")
    subs_parser.add_argument("--status", choices=[s.value for s in SubscriptionStatus], help="Filter by status")

    # Cleanup command
    subparsers.add_parser("cleanup", help="Clean up expired subscriptions and inactive users")

    args = parser.parse_args()

    try:
        if args.command == "server":
            asyncio.run(CommandManager.run_server(args.host, args.port, args.reload))
        elif args.command == "bot":
            asyncio.run(CommandManager.run_bot())
        elif args.command == "init":
            asyncio.run(init_db())
        elif args.command == "create-admin":
            asyncio.run(create_admin())
        elif args.command == "sync":
            asyncio.run(CommandManager.sync_servers())
        elif args.command == "users":
            asyncio.run(CommandManager.list_users(args.role, args.status))
        elif args.command == "subscriptions":
            asyncio.run(CommandManager.list_subscriptions(args.status))
        elif args.command == "cleanup":
            asyncio.run(CommandManager.cleanup_expired())
        else:
            parser.print_help()

    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Command failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
