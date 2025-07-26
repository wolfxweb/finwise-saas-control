from alembic import op
import sqlalchemy as sa

revision = 'fix_sku_unique_constraint'
down_revision = 'add_stock_fiscal_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Remover a constraint UNIQUE do campo SKU
    op.drop_index('ix_products_sku', table_name='products')
    
    # Recriar o índice sem UNIQUE
    op.create_index('ix_products_sku', 'products', ['sku'])

def downgrade():
    # Remover o índice normal
    op.drop_index('ix_products_sku', table_name='products')
    
    # Recriar o índice UNIQUE
    op.create_index('ix_products_sku', 'products', ['sku'], unique=True) 