"""add server cookie management

Revision ID: 20240306_01
Revises: # Leave this empty, alembic will fill it
Create Date: 2024-03-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20240306_01'
down_revision = None  # Update this with the previous migration's revision ID
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to server table
    op.add_column('server', sa.Column('xui_session_cookie', sa.String(), nullable=True))
    op.add_column('server', sa.Column('xui_cookie_expiry', sa.DateTime(), nullable=True))
    op.add_column('server', sa.Column('last_sync', sa.DateTime(), nullable=True))
    op.add_column('server', sa.Column('sync_status', sa.String(), nullable=False, server_default='pending'))
    op.add_column('server', sa.Column('sync_error', sa.String(), nullable=True))
    op.add_column('server', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('server', sa.Column('last_failed_login', sa.DateTime(), nullable=True))

    # Create index for sync_status for faster queries
    op.create_index(op.f('ix_server_sync_status'), 'server', ['sync_status'], unique=False)

def downgrade():
    # Remove columns from server table
    op.drop_index(op.f('ix_server_sync_status'), table_name='server')
    op.drop_column('server', 'last_failed_login')
    op.drop_column('server', 'failed_login_attempts')
    op.drop_column('server', 'sync_error')
    op.drop_column('server', 'sync_status')
    op.drop_column('server', 'last_sync')
    op.drop_column('server', 'xui_cookie_expiry')
    op.drop_column('server', 'xui_session_cookie')
