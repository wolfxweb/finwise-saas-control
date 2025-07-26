from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ProductType(str, enum.Enum):
    SIMPLE = "simple"  # Produto simples sem variações
    VARIATION = "variation"  # Produto com variações (cor, tamanho, etc.)
    COMPOSITE = "composite"  # Produto composto por outros produtos

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Informações básicas do produto
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    brand = Column(String(100))
    model = Column(String(100))
    
    # Tipo de produto
    product_type = Column(String(20), default="simple", nullable=False)
    
    # Classificação e códigos
    ncm = Column(String(20), index=True)  # Nomenclatura Comum do Mercosul
    ean = Column(String(20), index=True)  # Código de barras EAN
    gtin = Column(String(20), index=True)  # Global Trade Item Number
    
    # Categorização
    category = Column(String(100), index=True)
    subcategory = Column(String(100))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Dimensões e peso
    weight = Column(Float)  # Peso em kg
    length = Column(Float)  # Comprimento em cm
    width = Column(Float)   # Largura em cm
    height = Column(Float)  # Altura em cm
    
    # Status
    is_active = Column(Boolean, default=True)
    is_service = Column(Boolean, default=False)  # Se é serviço ou produto físico
    
    # SKU principal
    sku = Column(String(50), nullable=True, index=True)
    is_main_sku = Column(Boolean, default=False)
    
    # Campos de Estoque
    cost_price = Column(Float, default=0.0)
    sale_price = Column(Float, default=0.0)
    current_stock = Column(Integer, default=0)
    location = Column(String(100))
    min_stock = Column(Integer, default=0)
    max_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    
    # Campos Fiscais
    cest = Column(String(20))
    cfop = Column(String(10))
    icms_st = Column(Float, default=0.0)
    icms = Column(Float, default=0.0)
    ipi = Column(Float, default=0.0)
    pis = Column(Float, default=0.0)
    cofins = Column(Float, default=0.0)
    iss = Column(Float, default=0.0)
    iof = Column(Float, default=0.0)
    cide = Column(Float, default=0.0)
    csll = Column(Float, default=0.0)
    irrf = Column(Float, default=0.0)
    inss = Column(Float, default=0.0)
    fgts = Column(Float, default=0.0)
    outros_impostos = Column(Float, default=0.0)
    
    # Campos específicos para Marketplaces
    # Shopee
    shopee_category_id = Column(String(50))  # ID da categoria no Shopee
    shopee_category_name = Column(String(100))  # Nome da categoria no Shopee
    shopee_attributes = Column(JSON)  # Atributos específicos do Shopee
    shopee_warranty = Column(String(100))  # Garantia para Shopee
    shopee_brand_id = Column(String(50))  # ID da marca no Shopee
    shopee_model_id = Column(String(50))  # ID do modelo no Shopee
    shopee_is_pre_order = Column(Boolean, default=False)  # Se é pré-venda
    shopee_logistics = Column(JSON)  # Configurações de logística
    
    # Mercado Livre
    mercadolivre_category_id = Column(String(50))  # ID da categoria no ML
    mercadolivre_category_name = Column(String(100))  # Nome da categoria no ML
    mercadolivre_attributes = Column(JSON)  # Atributos específicos do ML
    mercadolivre_warranty = Column(String(100))  # Garantia para ML
    mercadolivre_brand_id = Column(String(50))  # ID da marca no ML
    mercadolivre_model_id = Column(String(50))  # ID do modelo no ML
    mercadolivre_condition = Column(String(20))  # novo, usado, recondicionado
    mercadolivre_listing_type = Column(String(20))  # gold_pro, gold_special, gold_premium
    mercadolivre_shipping = Column(JSON)  # Configurações de frete
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")
    category_obj = relationship("Category", foreign_keys=[category_id], back_populates="products")
    skus = relationship("ProductSKU", back_populates="product", cascade="all, delete-orphan")
    stock_movements = relationship("StockMovement", back_populates="product")
    
    # Relacionamentos para produtos compostos
    composite_components = relationship("ProductComponent", 
                                       foreign_keys="ProductComponent.composite_product_id",
                                       back_populates="composite_product", 
                                       cascade="all, delete-orphan")
    used_in_composites = relationship("ProductComponent", 
                                     foreign_keys="ProductComponent.component_product_id",
                                     back_populates="component_product")
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', company_id={self.company_id})>" 