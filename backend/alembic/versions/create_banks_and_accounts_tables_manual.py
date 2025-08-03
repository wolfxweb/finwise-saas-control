"""create banks and accounts tables

Revision ID: create_banks_and_accounts_manual
Revises: create_payable_categories_table
Create Date: 2025-08-02 23:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_banks_and_accounts_manual'
down_revision = 'create_payable_categories_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create banks table
    op.create_table('banks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_banks_id'), 'banks', ['id'], unique=False)
    
    # Create accounts table
    op.create_table('accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bank_id', sa.Integer(), nullable=False),
        sa.Column('account_type', sa.String(length=20), nullable=False),
        sa.Column('account_number', sa.String(length=50), nullable=False),
        sa.Column('agency', sa.String(length=20), nullable=False),
        sa.Column('holder_name', sa.String(length=255), nullable=False),
        sa.Column('balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('limit', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('available_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['bank_id'], ['banks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_id'), 'accounts', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_accounts_id'), table_name='accounts')
    op.drop_table('accounts')
    op.drop_index(op.f('ix_banks_id'), table_name='banks')
    op.drop_table('banks') 