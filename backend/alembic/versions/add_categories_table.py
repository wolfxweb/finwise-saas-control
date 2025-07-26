"""add_categories_table

Revision ID: add_categories_table
Revises: add_product_types_and_components
Create Date: 2025-07-25 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_categories_table'
down_revision = 'add_product_types_and_components'
branch_labels = None
depends_on = None

def upgrade():
    # Criar tabela categories
    op.create_table('categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criar índices
    op.create_index('ix_categories_id', 'categories', ['id'], unique=False)
    op.create_index('ix_categories_name', 'categories', ['name'], unique=False)
    op.create_index('ix_categories_code', 'categories', ['code'], unique=True)
    op.create_index('ix_categories_company_id', 'categories', ['company_id'], unique=False)
    op.create_index('ix_categories_parent_id', 'categories', ['parent_id'], unique=False)

def downgrade():
    # Remover índices
    op.drop_index('ix_categories_parent_id', table_name='categories')
    op.drop_index('ix_categories_company_id', table_name='categories')
    op.drop_index('ix_categories_code', table_name='categories')
    op.drop_index('ix_categories_name', table_name='categories')
    op.drop_index('ix_categories_id', table_name='categories')
    
    # Remover tabela
    op.drop_table('categories') 