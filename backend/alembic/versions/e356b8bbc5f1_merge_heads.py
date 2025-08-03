"""merge_heads

Revision ID: e356b8bbc5f1
Revises: 2c627465540f, create_banks_and_accounts_manual
Create Date: 2025-08-03 09:49:32.612742

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e356b8bbc5f1'
down_revision = ('2c627465540f', 'create_banks_and_accounts_manual')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
