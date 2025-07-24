"""add_origem_field_to_notas_fiscais

Revision ID: 4f08ffb8c2fa
Revises: e8f810f2a3f8
Create Date: 2025-07-24 01:30:05.691087

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4f08ffb8c2fa'
down_revision = 'e8f810f2a3f8'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar campo origem na tabela notas_fiscais
    op.add_column('notas_fiscais', sa.Column('origem', sa.String(50), nullable=True, server_default='manual'))


def downgrade():
    # Remover campo origem da tabela notas_fiscais
    op.drop_column('notas_fiscais', 'origem')
