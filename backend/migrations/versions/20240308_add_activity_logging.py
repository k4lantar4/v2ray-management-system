"""add activity logging

Revision ID: 20240308_add_activity_logging
Revises: 20240307_add_xui_api_integration
Create Date: 2024-03-08 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic
revision = '20240308_add_activity_logging'
down_revision = '20240307_add_xui_api_integration'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('details', JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(
        'ix_activity_logs_activity_type',
        'activity_logs',
        ['activity_type']
    )
    op.create_index(
        'ix_activity_logs_user_id',
        'activity_logs',
        ['user_id']
    )
    op.create_index(
        'ix_activity_logs_timestamp',
        'activity_logs',
        ['timestamp']
    )

def downgrade():
    op.drop_index('ix_activity_logs_timestamp')
    op.drop_index('ix_activity_logs_user_id')
    op.drop_index('ix_activity_logs_activity_type')
    op.drop_table('activity_logs')
