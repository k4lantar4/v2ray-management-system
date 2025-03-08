"""Add data integrity constraints

Revision ID: 003_add_constraints
Revises: 002_add_performance_indexes
Create Date: 2024-03-08 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_constraints'
down_revision: str = '002_add_performance_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add check constraints for user table
    op.create_check_constraint(
        'check_user_credit_non_negative',
        'user',
        'credit >= 0'
    )
    op.create_check_constraint(
        'check_user_language',
        'user',
        "language IN ('fa', 'en')"
    )
    
    # Add check constraints for server table
    op.create_check_constraint(
        'check_server_port_range',
        'server',
        'port BETWEEN 1 AND 65535'
    )
    op.create_check_constraint(
        'check_server_api_port_range',
        'server',
        'api_port BETWEEN 1 AND 65535'
    )
    op.create_check_constraint(
        'check_server_load_range',
        'server',
        'load BETWEEN 0 AND 100'
    )
    op.create_check_constraint(
        'check_server_max_users_positive',
        'server',
        'max_users > 0'
    )
    
    # Add check constraints for subscription table
    op.create_check_constraint(
        'check_subscription_traffic',
        'subscription',
        'used_traffic <= total_traffic'
    )
    op.create_check_constraint(
        'check_subscription_status',
        'subscription',
        "status IN ('active', 'expired', 'suspended')"
    )
    op.create_check_constraint(
        'check_subscription_upload_non_negative',
        'subscription',
        'upload >= 0'
    )
    op.create_check_constraint(
        'check_subscription_download_non_negative',
        'subscription',
        'download >= 0'
    )
    
    # Add check constraints for transaction table
    op.create_check_constraint(
        'check_transaction_type',
        'transaction',
        "type IN ('deposit', 'withdrawal', 'purchase', 'refund')"
    )
    op.create_check_constraint(
        'check_transaction_status',
        'transaction',
        "status IN ('pending', 'completed', 'failed', 'cancelled')"
    )


def downgrade() -> None:
    # Drop check constraints for transaction table
    op.drop_constraint('check_transaction_status', 'transaction', type_='check')
    op.drop_constraint('check_transaction_type', 'transaction', type_='check')
    
    # Drop check constraints for subscription table
    op.drop_constraint('check_subscription_download_non_negative', 'subscription', type_='check')
    op.drop_constraint('check_subscription_upload_non_negative', 'subscription', type_='check')
    op.drop_constraint('check_subscription_status', 'subscription', type_='check')
    op.drop_constraint('check_subscription_traffic', 'subscription', type_='check')
    
    # Drop check constraints for server table
    op.drop_constraint('check_server_max_users_positive', 'server', type_='check')
    op.drop_constraint('check_server_load_range', 'server', type_='check')
    op.drop_constraint('check_server_api_port_range', 'server', type_='check')
    op.drop_constraint('check_server_port_range', 'server', type_='check')
    
    # Drop check constraints for user table
    op.drop_constraint('check_user_language', 'user', type_='check')
    op.drop_constraint('check_user_credit_non_negative', 'user', type_='check') 