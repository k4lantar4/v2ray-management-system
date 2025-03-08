"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-03-08 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(32), nullable=True),
        sa.Column('first_name', sa.String(64), nullable=False),
        sa.Column('last_name', sa.String(64), nullable=True),
        sa.Column('credit', sa.Float(), nullable=False, default=0.0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_banned', sa.Boolean(), nullable=False, default=False),
        sa.Column('language', sa.String(2), nullable=False, default='fa'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('telegram_id')
    )
    op.create_index('ix_user_telegram_id', 'user', ['telegram_id'])

    # Create servers table
    op.create_table(
        'server',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('host', sa.String(255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(64), nullable=False),
        sa.Column('password', sa.String(64), nullable=False),
        sa.Column('api_port', sa.Integer(), nullable=False, default=8080),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('max_users', sa.Integer(), nullable=False, default=500),
        sa.Column('load', sa.Float(), nullable=False, default=0.0),
        sa.Column('bandwidth_limit', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_server_name', 'server', ['name'])
    op.create_index('ix_server_host', 'server', ['host'])

    # Create plans table
    op.create_table(
        'plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('traffic', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('max_users', sa.Integer(), nullable=True),
        sa.Column('features', sqlmodel.JSON(), nullable=False, default={}),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.CheckConstraint('price > 0', name='check_positive_price'),
        sa.CheckConstraint('duration > 0', name='check_positive_duration'),
        sa.CheckConstraint('traffic > 0', name='check_positive_traffic')
    )
    op.create_index('ix_plan_name', 'plan', ['name'])

    # Create subscriptions table
    op.create_table(
        'subscription',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('server_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('status', sa.String(16), nullable=False, default='active'),
        sa.Column('expire_date', sa.DateTime(), nullable=False),
        sa.Column('total_traffic', sa.Integer(), nullable=False),
        sa.Column('used_traffic', sa.Integer(), nullable=False, default=0),
        sa.Column('upload', sa.BigInteger(), nullable=False, default=0),
        sa.Column('download', sa.BigInteger(), nullable=False, default=0),
        sa.Column('settings', sqlmodel.JSON(), nullable=False, default={}),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['server_id'], ['server.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['plan.id'], ondelete='CASCADE')
    )
    op.create_index('ix_subscription_user_id', 'subscription', ['user_id'])
    op.create_index('ix_subscription_server_id', 'subscription', ['server_id'])
    op.create_index('ix_subscription_plan_id', 'subscription', ['plan_id'])

    # Create transactions table
    op.create_table(
        'transaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(16), nullable=False),
        sa.Column('status', sa.String(16), nullable=False, default='pending'),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_id', sa.String(64), nullable=True),
        sa.Column('metadata', sqlmodel.JSON(), nullable=False, default={}),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.CheckConstraint('amount > 0', name='check_positive_amount')
    )
    op.create_index('ix_transaction_user_id', 'transaction', ['user_id'])
    op.create_index('ix_transaction_type', 'transaction', ['type'])
    op.create_index('ix_transaction_reference_id', 'transaction', ['reference_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('transaction')
    op.drop_table('subscription')
    op.drop_table('plan')
    op.drop_table('server')
    op.drop_table('user') 