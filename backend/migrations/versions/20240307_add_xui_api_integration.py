"""Add XUI API integration

Revision ID: 20240307_add_xui_api
Revises: 20240306_add_server_metrics
Create Date: 2024-03-07 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20240307_add_xui_api'
down_revision = '20240306_add_server_metrics'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # No schema changes needed - all new functionality is handled through API endpoints
    # and response models without requiring database modifications
    pass

def downgrade() -> None:
    # No schema changes to revert
    pass
