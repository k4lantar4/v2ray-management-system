"""Add backup system

Revision ID: 20240309_add_backup_system
Revises: 20240308_add_activity_logging
Create Date: 2024-03-09 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20240309_add_backup_system'
down_revision = '20240308_add_activity_logging'
branch_labels = None
depends_on = None

def upgrade():
    # Create backup_metadata table
    op.create_table(
        'backup_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('backup_path', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('database_tables', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('config_files', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('is_encrypted', sa.Boolean(), nullable=False, default=False),
        sa.Column('compression_level', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on timestamp for faster cleanup queries
    op.create_index(
        'ix_backup_metadata_timestamp',
        'backup_metadata',
        ['timestamp']
    )
    
    # Create index on status for filtering
    op.create_index(
        'ix_backup_metadata_status',
        'backup_metadata',
        ['status']
    )

def downgrade():
    # Drop indexes
    op.drop_index('ix_backup_metadata_status')
    op.drop_index('ix_backup_metadata_timestamp')
    
    # Drop backup_metadata table
    op.drop_table('backup_metadata')
