from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TaxType(enum.Enum):
    ICMS = "ICMS"
    IPI = "IPI"
    PIS = "PIS"
    COFINS = "COFINS"
    ISS = "ISS"
    II = "II"  # Imposto de Importação
    IOF = "IOF"

class ProductSKU(Base):
    __tablename__ = "product_skus"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Identificação única do SKU
    sku_code = Column(String(50), nullable=False, unique=True, index=True)
    barcode = Column(String(50), index=True)  # Código de barras específico do SKU
    
    # Variações do produto
    color = Column(String(50))
    size = Column(String(20))
    material = Column(String(100))
    flavor = Column(String(50))
    variant_description = Column(Text)  # Descrição da variação
    
    # Preços
    cost_price = Column(Float, nullable=False)  # Preço de custo
    sale_price = Column(Float, nullable=False)  # Preço de venda
    wholesale_price = Column(Float)  # Preço atacado
    promotional_price = Column(Float)  # Preço promocional
    
    # Controle de estoque
    current_stock = Column(Integer, default=0)  # Estoque atual
    minimum_stock = Column(Integer, default=0)  # Estoque mínimo
    maximum_stock = Column(Integer)  # Estoque máximo
    reserved_stock = Column(Integer, default=0)  # Estoque reservado
    
    # Localização no estoque
    warehouse_location = Column(String(100))  # Localização no armazém
    shelf_location = Column(String(50))  # Localização na prateleira
    
    # Impostos (JSON para flexibilidade)
    taxes = Column(JSON, default=dict)  # Estrutura: {"ICMS": 18.0, "IPI": 5.0, ...}
    
    # Informações adicionais
    supplier_sku = Column(String(50))  # SKU do fornecedor
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_available_for_sale = Column(Boolean, default=True)
    is_stock_sku = Column(Boolean, default=False)  # Se é o SKU principal de estoque
    stock_sku_id = Column(Integer, ForeignKey("product_skus.id"))  # Referência ao SKU de estoque principal
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    product = relationship("Product", back_populates="skus")
    supplier = relationship("Supplier")
    stock_movements = relationship("StockMovement", back_populates="sku")
    stock_sku = relationship("ProductSKU", remote_side=[id])  # SKU de estoque principal
    associated_skus = relationship("ProductSKU", back_populates="stock_sku")  # SKUs associados
    branch_stocks = relationship("StockBranch", back_populates="sku")  # Estoque por filial
    
    def __repr__(self):
        return f"<ProductSKU(id={self.id}, sku_code='{self.sku_code}', product_id={self.product_id})>"
    
    @property
    def available_stock(self):
        """Estoque disponível para venda"""
        # Se é um SKU associado, usa o estoque do SKU principal
        if not self.is_stock_sku and self.stock_sku_id:
            stock_sku = self.stock_sku
            if stock_sku:
                current = stock_sku.current_stock or 0
                reserved = stock_sku.reserved_stock or 0
                return max(0, current - reserved)
        
        # Se é o SKU principal ou não tem associação
        current = self.current_stock or 0
        reserved = self.reserved_stock or 0
        return max(0, current - reserved)
    
    @property
    def stock_status(self):
        """Status do estoque"""
        # Se é um SKU associado, usa o status do SKU principal
        if not self.is_stock_sku and self.stock_sku_id:
            stock_sku = self.stock_sku
            if stock_sku:
                if stock_sku.current_stock <= 0:
                    return "out_of_stock"
                elif stock_sku.current_stock <= stock_sku.minimum_stock:
                    return "low_stock"
                else:
                    return "in_stock"
        
        # Se é o SKU principal ou não tem associação
        if self.current_stock <= 0:
            return "out_of_stock"
        elif self.current_stock <= self.minimum_stock:
            return "low_stock"
        else:
            return "in_stock"
    
    def calculate_total_tax_rate(self):
        """Calcula a taxa total de impostos"""
        if not self.taxes:
            return 0.0
        return sum(self.taxes.values())
    
    def calculate_price_with_taxes(self, price_type="sale_price"):
        """Calcula o preço com impostos"""
        base_price = getattr(self, price_type, 0) or 0
        tax_rate = self.calculate_total_tax_rate()
        return base_price * (1 + tax_rate / 100) 