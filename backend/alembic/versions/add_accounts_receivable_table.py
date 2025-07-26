"""add accounts receivable table

Revision ID: add_accounts_receivable_table
Revises: make_customer_email_optional
Create Date: 2025-01-26 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_accounts_receivable_table'
down_revision = 'make_customer_email_optional'
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela accounts_receivable
    op.create_table('accounts_receivable',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('receivable_type', sa.Enum('cash', 'installment', name='receivabletype'), nullable=True),
        sa.Column('status', sa.Enum('pending', 'paid', 'overdue', 'cancelled', name='receivablestatus'), nullable=True),
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
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_receivable_id'), 'accounts_receivable', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_accounts_receivable_id'), table_name='accounts_receivable')
    op.drop_table('accounts_receivable') 