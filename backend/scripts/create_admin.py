#!/usr/bin/env python3
"""
🔑 Admin User Creation Script
Creates the initial admin user for the V2Ray Management System
"""

import asyncio
import logging
from getpass import getpass
import re
import sys

from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

sys.path.append(".")  # Add current directory to path

from backend.app.db.session import engine
from backend.app.db.models.user import User, UserRole, UserStatus
from backend.app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def validate_phone(phone: str) -> bool:
    """Validate Iranian phone number"""
    pattern = r'^\+98[0-9]{10}$'
    return bool(re.match(pattern, phone))

async def create_admin():
    """Create admin user interactively"""
    try:
        print("🔐 V2Ray Management System - Admin User Creation")
        print("=" * 50)

        # Get admin details
        while True:
            phone = input("📱 Enter admin phone number (+98XXXXXXXXXX): ")
            if not await validate_phone(phone):
                print("❌ Invalid phone number format. Must be +98 followed by 10 digits.")
                continue
            break

        while True:
            password = getpass("🔑 Enter admin password (min 8 chars): ")
            if len(password) < 8:
                print("❌ Password must be at least 8 characters long.")
                continue
            
            confirm_password = getpass("🔄 Confirm password: ")
            if password != confirm_password:
                print("❌ Passwords don't match.")
                continue
            break

        full_name = input("👤 Enter admin full name: ")

        # Create admin user
        admin_user = User(
            phone=phone,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            wallet_balance=0.0
        )

        # Save to database
        with Session(engine) as session:
            # Check if admin already exists
            existing_admin = session.exec(
                select(User).where(User.role == UserRole.ADMIN)
            ).first()
            
            if existing_admin:
                print("⚠️ An admin user already exists!")
                update = input("Do you want to create another admin? (y/N): ")
                if update.lower() != 'y':
                    return

            try:
                session.add(admin_user)
                session.commit()
                session.refresh(admin_user)
                
                print("\n✅ Admin user created successfully!")
                print(f"""
📋 Admin Details:
• Phone: {admin_user.phone}
• Role: {admin_user.role}
• Status: {admin_user.status}
• Created at: {admin_user.created_at}
""")

            except IntegrityError:
                print("❌ Error: Phone number already registered!")
                return

    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user.")
        return
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        return

def main():
    """Main function"""
    try:
        asyncio.run(create_admin())
    except Exception as e:
        logger.error(f"Failed to create admin user: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
