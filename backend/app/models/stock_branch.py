from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class StockBranch(Base):
    __tablename__ = "stock_branches"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relacionamentos
    sku_id = Column(Integer, ForeignKey("product_skus.id"), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    
    # Controle de estoque por filial
    current_stock = Column(Integer, default=0)  # Estoque atual na filial
    minimum_stock = Column(Integer, default=0)  # Estoque mínimo na filial
    maximum_stock = Column(Integer)  # Estoque máximo na filial
    reserved_stock = Column(Integer, default=0)  # Estoque reservado na filial
    
    # Localização específica da filial
    warehouse_location = Column(String(100))  # Localização no armazém da filial
    shelf_location = Column(String(50))  # Localização na prateleira da filial
    notes = Column(Text)  # Observações específicas da filial
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    sku = relationship("ProductSKU", back_populates="branch_stocks")
    branch = relationship("Branch")
    
    def __repr__(self):
        return f"<StockBranch(id={self.id}, sku_id={self.sku_id}, branch_id={self.branch_id})>"
    
    @property
    def available_stock(self):
        """Estoque disponível para venda na filial"""
        current = self.current_stock or 0
        reserved = self.reserved_stock or 0
        return max(0, current - reserved)
    
    @property
    def stock_status(self):
        """Status do estoque na filial"""
        if self.current_stock <= 0:
            return "out_of_stock"
        elif self.current_stock <= self.minimum_stock:
            return "low_stock"
        elif self.maximum_stock and self.current_stock >= self.maximum_stock:
            return "high_stock"
        else:
            return "normal" 