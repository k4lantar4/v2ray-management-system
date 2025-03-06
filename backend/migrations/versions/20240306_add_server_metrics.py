"""add server metrics history

Revision ID: 20240306_02
Revises: 20240306_01
Create Date: 2024-03-06 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20240306_02'
down_revision = '20240306_01'
branch_labels = None
depends_on = None

def upgrade():
    # Create server_metrics table
    op.create_table(
        'server_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('server_id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('cpu_usage', sa.Float(), nullable=False),
        sa.Column('memory_usage', sa.Float(), nullable=False),
        sa.Column('disk_usage', sa.Float(), nullable=False),
        sa.Column('bandwidth_in', sa.Float(), nullable=False),
        sa.Column('bandwidth_out', sa.Float(), nullable=False),
        sa.Column('active_connections', sa.Integer(), nullable=False),
        sa.Column('load_avg_1m', sa.Float(), nullable=False),
        sa.Column('load_avg_5m', sa.Float(), nullable=False),
        sa.Column('load_avg_15m', sa.Float(), nullable=False),
        sa.Column('response_time', sa.Float(), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=False),
        sa.Column('cookie_valid', sa.Boolean(), nullable=False),
        sa.Column('login_success', sa.Boolean(), nullable=False),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['server_id'], ['server.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_server_metrics_server_id'), 'server_metrics', ['server_id'], unique=False)
    op.create_index(op.f('ix_server_metrics_timestamp'), 'server_metrics', ['timestamp'], unique=False)
    
    # Create index for querying recent metrics efficiently
    op.create_index(
        'ix_server_metrics_server_timestamp',
        'server_metrics',
        ['server_id', 'timestamp'],
        unique=False
    )

def downgrade():
    # Drop indexes
    op.drop_index('ix_server_metrics_server_timestamp', table_name='server_metrics')
    op.drop_index(op.f('ix_server_metrics_timestamp'), table_name='server_metrics')
    op.drop_index(op.f('ix_server_metrics_server_id'), table_name='server_metrics')
    
    # Drop table
    op.drop_table('server_metrics')
