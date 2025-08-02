"""add accounts payable table

Revision ID: add_accounts_payable_table
Revises: add_accounts_receivable_table
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_accounts_payable_table'
down_revision = 'add_accounts_receivable_table'
branch_labels = None
depends_on = None


def upgrade():
    # Criar enum para status de contas a pagar
    op.execute("CREATE TYPE payablestatus AS ENUM ('pending', 'paid', 'overdue', 'cancelled')")
    
    # Criar enum para tipo de contas a pagar
    op.execute("CREATE TYPE payabletype AS ENUM ('cash', 'installment')")
    
    # Criar tabela accounts_payable
    op.create_table('accounts_payable',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('payable_type', sa.Enum('cash', 'installment', name='payabletype'), nullable=True),
        sa.Column('status', sa.Enum('pending', 'paid', 'overdue', 'cancelled', name='payablestatus'), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('installment_number', sa.Integer(), nullable=True),
        sa.Column('total_installments', sa.Integer(), nullable=True),
        sa.Column('installment_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criar índices
    op.create_index(op.f('ix_accounts_payable_id'), 'accounts_payable', ['id'], unique=False)
    op.create_index(op.f('ix_accounts_payable_company_id'), 'accounts_payable', ['company_id'], unique=False)
    op.create_index(op.f('ix_accounts_payable_supplier_id'), 'accounts_payable', ['supplier_id'], unique=False)
    op.create_index(op.f('ix_accounts_payable_category_id'), 'accounts_payable', ['category_id'], unique=False)
    op.create_index(op.f('ix_accounts_payable_due_date'), 'accounts_payable', ['due_date'], unique=False)
    op.create_index(op.f('ix_accounts_payable_status'), 'accounts_payable', ['status'], unique=False)


def downgrade():
    # Remover índices
    op.drop_index(op.f('ix_accounts_payable_status'), table_name='accounts_payable')
    op.drop_index(op.f('ix_accounts_payable_due_date'), table_name='accounts_payable')
    op.drop_index(op.f('ix_accounts_payable_category_id'), table_name='accounts_payable')
    op.drop_index(op.f('ix_accounts_payable_supplier_id'), table_name='accounts_payable')
    op.drop_index(op.f('ix_accounts_payable_company_id'), table_name='accounts_payable')
    op.drop_index(op.f('ix_accounts_payable_id'), table_name='accounts_payable')
    
    # Remover tabela
    op.drop_table('accounts_payable')
    
    # Remover enums
    op.execute("DROP TYPE payabletype")
    op.execute("DROP TYPE payablestatus") 