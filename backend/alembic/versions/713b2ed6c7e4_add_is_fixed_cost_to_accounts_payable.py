"""add_is_fixed_cost_to_accounts_payable

Revision ID: 713b2ed6c7e4
Revises: 75a869094852
Create Date: 2025-08-03 16:09:41.049021

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '713b2ed6c7e4'
down_revision = '75a869094852'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('accounts_payable', sa.Column('is_fixed_cost', sa.String(1), nullable=True, server_default='N'))


def downgrade():
    op.drop_column('accounts_payable', 'is_fixed_cost')
