from alembic import op
import sqlalchemy as sa

revision = 'add_stock_fiscal_fields'
down_revision = 'add_category_id_to_products'
branch_labels = None
depends_on = None

def upgrade():
    # Adicionar campos de SKU principal
    op.add_column('products', sa.Column('sku', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)
    op.add_column('products', sa.Column('is_main_sku', sa.Boolean(), nullable=True, default=False))
    
    # Adicionar campos de Estoque
    op.add_column('products', sa.Column('cost_price', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('sale_price', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('current_stock', sa.Integer(), nullable=True, default=0))
    op.add_column('products', sa.Column('location', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('min_stock', sa.Integer(), nullable=True, default=0))
    op.add_column('products', sa.Column('max_stock', sa.Integer(), nullable=True, default=0))
    op.add_column('products', sa.Column('reserved_stock', sa.Integer(), nullable=True, default=0))
    
    # Adicionar campos Fiscais
    op.add_column('products', sa.Column('cest', sa.String(length=20), nullable=True))
    op.add_column('products', sa.Column('cfop', sa.String(length=10), nullable=True))
    op.add_column('products', sa.Column('icms_st', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('icms', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('ipi', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('pis', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('cofins', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('iss', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('iof', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('cide', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('csll', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('irrf', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('inss', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('fgts', sa.Float(), nullable=True, default=0.0))
    op.add_column('products', sa.Column('outros_impostos', sa.Float(), nullable=True, default=0.0))

def downgrade():
    # Remover campos Fiscais
    op.drop_column('products', 'outros_impostos')
    op.drop_column('products', 'fgts')
    op.drop_column('products', 'inss')
    op.drop_column('products', 'irrf')
    op.drop_column('products', 'csll')
    op.drop_column('products', 'cide')
    op.drop_column('products', 'iof')
    op.drop_column('products', 'iss')
    op.drop_column('products', 'cofins')
    op.drop_column('products', 'pis')
    op.drop_column('products', 'ipi')
    op.drop_column('products', 'icms')
    op.drop_column('products', 'icms_st')
    op.drop_column('products', 'cfop')
    op.drop_column('products', 'cest')
    
    # Remover campos de Estoque
    op.drop_column('products', 'reserved_stock')
    op.drop_column('products', 'max_stock')
    op.drop_column('products', 'min_stock')
    op.drop_column('products', 'location')
    op.drop_column('products', 'current_stock')
    op.drop_column('products', 'sale_price')
    op.drop_column('products', 'cost_price')
    
    # Remover campos de SKU principal
    op.drop_column('products', 'is_main_sku')
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_column('products', 'sku') 