"""add_accounts_module

Revision ID: fe480fec3c20
Revises: e356b8bbc5f1
Create Date: 2025-08-03 09:49:40.239280

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'fe480fec3c20'
down_revision = 'e356b8bbc5f1'
branch_labels = None
depends_on = None


def upgrade():
    # Inserir o módulo de Contas
    op.execute("""
        INSERT INTO modules (id, name, code, description, price, category, status, created_at, updated_at)
        VALUES (
            '{}',
            'Gestão de Contas',
            'accounts',
            'Módulo para gestão de bancos e contas correntes',
            45.00,
            'financeiro',
            'active',
            NOW(),
            NOW()
        )
    """.format(str(uuid.uuid4())))


def downgrade():
    # Remover o módulo de Contas
    op.execute("DELETE FROM modules WHERE code = 'accounts'")
