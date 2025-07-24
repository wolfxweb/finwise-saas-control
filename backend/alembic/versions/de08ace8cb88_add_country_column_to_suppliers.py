"""add country column to suppliers

Revision ID: de08ace8cb88
Revises: 6874a3de325d
Create Date: 2025-07-23 22:00:24.600970

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'de08ace8cb88'
down_revision = '6874a3de325d'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna country na tabela suppliers
    op.add_column('suppliers', sa.Column('country', sa.String(100), nullable=True, server_default='Brasil'))


def downgrade():
    # Remover coluna country da tabela suppliers
    op.drop_column('suppliers', 'country')
