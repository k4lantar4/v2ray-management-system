"""Add performance indexes

Revision ID: 002_add_performance_indexes
Revises: 001_initial_schema
Create Date: 2024-03-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_performance_indexes'
down_revision: str = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # User table indexes
    op.create_index('ix_user_is_active', 'user', ['is_active'])
    op.create_index('ix_user_is_banned', 'user', ['is_banned'])
    op.create_index('ix_user_created_at', 'user', ['created_at'])
    
    # Server table indexes
    op.create_index('ix_server_is_active', 'server', ['is_active'])
    op.create_index('ix_server_load', 'server', ['load'])
    op.create_index('ix_server_max_users', 'server', ['max_users'])
    
    # Plan table indexes
    op.create_index('ix_plan_is_active', 'plan', ['is_active'])
    op.create_index('ix_plan_price', 'plan', ['price'])
    op.create_index('ix_plan_sort_order', 'plan', ['sort_order'])
    
    # Subscription table indexes
    op.create_index('ix_subscription_status', 'subscription', ['status'])
    op.create_index('ix_subscription_expire_date', 'subscription', ['expire_date'])
    op.create_index('ix_subscription_created_at', 'subscription', ['created_at'])
    # Composite indexes for common queries
    op.create_index(
        'ix_subscription_user_status',
        'subscription',
        ['user_id', 'status']
    )
    op.create_index(
        'ix_subscription_server_status',
        'subscription',
        ['server_id', 'status']
    )
    
    # Transaction table indexes
    op.create_index('ix_transaction_status', 'transaction', ['status'])
    op.create_index('ix_transaction_created_at', 'transaction', ['created_at'])
    # Composite indexes for common queries
    op.create_index(
        'ix_transaction_user_type',
        'transaction',
        ['user_id', 'type']
    )
    op.create_index(
        'ix_transaction_user_status',
        'transaction',
        ['user_id', 'status']
    )


def downgrade() -> None:
    # Drop transaction indexes
    op.drop_index('ix_transaction_user_status', 'transaction')
    op.drop_index('ix_transaction_user_type', 'transaction')
    op.drop_index('ix_transaction_created_at', 'transaction')
    op.drop_index('ix_transaction_status', 'transaction')
    
    # Drop subscription indexes
    op.drop_index('ix_subscription_server_status', 'subscription')
    op.drop_index('ix_subscription_user_status', 'subscription')
    op.drop_index('ix_subscription_created_at', 'subscription')
    op.drop_index('ix_subscription_expire_date', 'subscription')
    op.drop_index('ix_subscription_status', 'subscription')
    
    # Drop plan indexes
    op.drop_index('ix_plan_sort_order', 'plan')
    op.drop_index('ix_plan_price', 'plan')
    op.drop_index('ix_plan_is_active', 'plan')
    
    # Drop server indexes
    op.drop_index('ix_server_max_users', 'server')
    op.drop_index('ix_server_load', 'server')
    op.drop_index('ix_server_is_active', 'server')
    
    # Drop user indexes
    op.drop_index('ix_user_created_at', 'user')
    op.drop_index('ix_user_is_banned', 'user')
    op.drop_index('ix_user_is_active', 'user') 