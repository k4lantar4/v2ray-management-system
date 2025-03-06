#!/usr/bin/env python3
"""
🗄️ Database Initialization Script
Sets up the initial database structure and required tables
"""

import asyncio
import logging
import sys
from typing import List

from sqlmodel import SQLModel, Session
from sqlalchemy.exc import SQLAlchemyError

sys.path.append(".")  # Add current directory to path

from backend.app.db.session import engine
from backend.app.db.models.user import User, UserRole, UserStatus
from backend.app.db.models.subscription import Subscription, SubscriptionStatus
from backend.app.db.models.server import Server, ServerStatus
from backend.app.db.models.payment import Payment, PaymentStatus, PaymentMethod
from backend.app.db.models.discount import Discount
from backend.app.db.models.ticket import Ticket, TicketStatus
from backend.app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_initial_servers() -> List[Server]:
    """Create initial server configurations"""
    servers = [
        Server(
            name="Iran Server",
            domain="ir.example.com",
            xui_panel_url="https://ir.example.com:1234",
            xui_username=settings.XUI_USERNAME,
            xui_password=settings.XUI_PASSWORD,
            status=ServerStatus.ACTIVE,
            location="IR",
            max_users=1000,
            bandwidth_limit=10000,  # 10TB in GB
            current_users=0,
            bandwidth_used=0
        ),
        Server(
            name="Europe Server",
            domain="eu.example.com",
            xui_panel_url="https://eu.example.com:1234",
            xui_username=settings.XUI_USERNAME,
            xui_password=settings.XUI_PASSWORD,
            status=ServerStatus.ACTIVE,
            location="DE",
            max_users=1000,
            bandwidth_limit=10000,
            current_users=0,
            bandwidth_used=0
        )
    ]
    return servers

async def create_initial_discounts() -> List[Discount]:
    """Create initial discount codes"""
    discounts = [
        Discount(
            code="WELCOME2025",
            amount=20,
            is_fixed=False,  # Percentage discount
            max_uses=1000,
            current_uses=0,
            expires_at=None,  # Never expires
            description="Welcome discount for new users"
        ),
        Discount(
            code="VIP30",
            amount=30,
            is_fixed=False,
            max_uses=None,  # Unlimited uses
            current_uses=0,
            expires_at=None,
            description="VIP user discount"
        )
    ]
    return discounts

async def init_db():
    """Initialize database with required tables and initial data"""
    try:
        print("🗄️ Initializing database...")
        print("=" * 50)

        # Create all tables
        print("📝 Creating database tables...")
        SQLModel.metadata.create_all(engine)

        # Create initial data
        with Session(engine) as session:
            # Create servers
            print("🖥️ Creating initial servers...")
            servers = await create_initial_servers()
            for server in servers:
                try:
                    session.add(server)
                    print(f"✅ Added server: {server.name}")
                except SQLAlchemyError as e:
                    print(f"❌ Error adding server {server.name}: {str(e)}")
                    continue

            # Create discount codes
            print("\n🎁 Creating initial discount codes...")
            discounts = await create_initial_discounts()
            for discount in discounts:
                try:
                    session.add(discount)
                    print(f"✅ Added discount code: {discount.code}")
                except SQLAlchemyError as e:
                    print(f"❌ Error adding discount {discount.code}: {str(e)}")
                    continue

            try:
                session.commit()
                print("\n✅ Database initialization completed successfully!")
                
                print("""
📋 Summary:
• Database tables created
• Initial servers configured
• Discount codes added

🔧 Next steps:
1. Run create_admin.py to create admin user
2. Configure environment variables
3. Start the application services
""")

            except SQLAlchemyError as e:
                print(f"\n❌ Error committing changes: {str(e)}")
                return

    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user.")
        return
    except Exception as e:
        print(f"\n❌ Error initializing database: {str(e)}")
        return

def main():
    """Main function"""
    try:
        asyncio.run(init_db())
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
