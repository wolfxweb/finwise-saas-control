"""add_category_id_to_products

Revision ID: add_category_id_to_products
Revises: add_categories_table
Create Date: 2025-07-25 22:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_category_id_to_products'
down_revision = 'add_categories_table'
branch_labels = None
depends_on = None

def upgrade():
    # Adicionar coluna category_id na tabela products
    op.add_column('products', sa.Column('category_id', sa.Integer(), nullable=True))
    
    # Adicionar foreign key constraint
    op.create_foreign_key(
        'fk_products_category_id_categories',
        'products', 'categories',
        ['category_id'], ['id']
    )
    
    # Criar índice para performance
    op.create_index('ix_products_category_id', 'products', ['category_id'], unique=False)

def downgrade():
    # Remover índice
    op.drop_index('ix_products_category_id', table_name='products')
    
    # Remover foreign key constraint
    op.drop_constraint('fk_products_category_id_categories', 'products', type_='foreignkey')
    
    # Remover coluna
    op.drop_column('products', 'category_id') 