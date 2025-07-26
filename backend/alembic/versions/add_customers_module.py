"""add_customers_module

Revision ID: add_customers_module
Revises: add_customers_table
Create Date: 2025-07-26 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'add_customers_module'
down_revision = 'add_customers_table'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar módulo de clientes
    op.execute("""
        INSERT INTO modules (id, name, code, description, price, category, status, created_at)
        VALUES (
            '{}',
            'Gestão de Clientes',
            'CLIENTES',
            'Cadastro e gestão completa de clientes com controle de crédito e histórico',
            30.00,
            'sales',
            'active',
            NOW()
        )
        ON CONFLICT (code) DO NOTHING;
    """.format(str(uuid.uuid4())))


def downgrade():
    # Remover módulo de clientes
    op.execute("DELETE FROM modules WHERE code = 'CLIENTES';") 