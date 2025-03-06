"""
🔄 Alembic Environment Configuration
Handles database migration environment setup and execution
"""

import asyncio
from logging.config import fileConfig
import os
import sys
from typing import List

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.config import settings
from backend.app.db.models.base import Base
from backend.app.db.models.user import User
from backend.app.db.models.subscription import Subscription
from backend.app.db.models.server import Server
from backend.app.db.models.payment import Payment
from backend.app.db.models.discount import Discount
from backend.app.db.models.ticket import Ticket

# Load Alembic configuration
config = context.config

# Set SQLAlchemy URL from settings
config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)

# Load logging configuration
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get metadata for autogenerate support
target_metadata = Base.metadata

def get_revision_dependencies() -> List[str]:
    """Get dependencies for the current revision"""
    # Add any revision dependencies here
    return []

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        version_table="alembic_version",
        include_name=True,
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    """Run actual migrations"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        version_table="alembic_version",
        include_name=True,
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """Run migrations in async mode"""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
