"""add_account_id_to_accounts_payable

Revision ID: 2b56de293529
Revises: 713b2ed6c7e4
Create Date: 2025-08-03 19:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2b56de293529'
down_revision = '713b2ed6c7e4'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna account_id à tabela accounts_payable
    op.add_column('accounts_payable', sa.Column('account_id', sa.Integer(), nullable=True))
    
    # Adicionar foreign key constraint
    op.create_foreign_key(
        'accounts_payable_account_id_fkey',
        'accounts_payable', 'accounts',
        ['account_id'], ['id']
    )


def downgrade():
    # Remover foreign key constraint
    op.drop_constraint('accounts_payable_account_id_fkey', 'accounts_payable', type_='foreignkey')
    
    # Remover coluna account_id
    op.drop_column('accounts_payable', 'account_id')
