"""
${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel
${imports if imports else ""}

# Revision identifiers
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}

def upgrade() -> None:
    """Upgrade database to this revision"""
    ${upgrades if upgrades else "pass"}

def downgrade() -> None:
    """Downgrade database from this revision"""
    ${downgrades if downgrades else "pass"}

def schema_upgrades() -> None:
    """Schema upgrade migrations go here"""
    pass

def schema_downgrades() -> None:
    """Schema downgrade migrations go here"""
    pass

def data_upgrades() -> None:
    """Add any optional data upgrade migrations here"""
    pass

def data_downgrades() -> None:
    """Add any optional data downgrade migrations here"""
    pass

def upgrade_data() -> None:
    """Upgrade both schema and data"""
    schema_upgrades()
    data_upgrades()

def downgrade_data() -> None:
    """Downgrade both schema and data"""
    data_downgrades()
    schema_downgrades()
