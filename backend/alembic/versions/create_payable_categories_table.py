"""create payable categories table

Revision ID: create_payable_categories_table
Revises: add_accounts_payable_table
Create Date: 2025-02-08 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_payable_categories_table'
down_revision = 'add_accounts_payable_table'
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela payable_categories
    op.create_table('payable_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['payable_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criar índices
    op.create_index(op.f('ix_payable_categories_id'), 'payable_categories', ['id'], unique=False)
    op.create_index(op.f('ix_payable_categories_name'), 'payable_categories', ['name'], unique=False)
    op.create_index(op.f('ix_payable_categories_code'), 'payable_categories', ['code'], unique=True)
    op.create_index(op.f('ix_payable_categories_company_id'), 'payable_categories', ['company_id'], unique=False)
    op.create_index(op.f('ix_payable_categories_parent_id'), 'payable_categories', ['parent_id'], unique=False)
    op.create_index(op.f('ix_payable_categories_is_active'), 'payable_categories', ['is_active'], unique=False)
    
    # Atualizar a foreign key na tabela accounts_payable
    op.drop_constraint('accounts_payable_category_id_fkey', 'accounts_payable', type_='foreignkey')
    op.create_foreign_key('accounts_payable_category_id_fkey', 'accounts_payable', 'payable_categories', ['category_id'], ['id'])


def downgrade():
    # Reverter a foreign key na tabela accounts_payable
    op.drop_constraint('accounts_payable_category_id_fkey', 'accounts_payable', type_='foreignkey')
    op.create_foreign_key('accounts_payable_category_id_fkey', 'accounts_payable', 'categories', ['category_id'], ['id'])
    
    # Remover índices
    op.drop_index(op.f('ix_payable_categories_is_active'), table_name='payable_categories')
    op.drop_index(op.f('ix_payable_categories_parent_id'), table_name='payable_categories')
    op.drop_index(op.f('ix_payable_categories_company_id'), table_name='payable_categories')
    op.drop_index(op.f('ix_payable_categories_code'), table_name='payable_categories')
    op.drop_index(op.f('ix_payable_categories_name'), table_name='payable_categories')
    op.drop_index(op.f('ix_payable_categories_id'), table_name='payable_categories')
    
    # Remover tabela
    op.drop_table('payable_categories') 