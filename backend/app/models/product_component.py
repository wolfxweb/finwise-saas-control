from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ProductComponent(Base):
    __tablename__ = "product_components"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Produto composto (que contém outros produtos)
    composite_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Produto componente (que faz parte do produto composto)
    component_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Quantidade do componente necessário
    quantity = Column(Float, nullable=False, default=1.0)
    
    # Unidade de medida
    unit = Column(String(20), default="un")
    
    # Se o componente é obrigatório ou opcional
    is_required = Column(Boolean, default=True)
    
    # Ordem de montagem/processo
    assembly_order = Column(Integer, default=0)
    
    # Instruções específicas para este componente
    instructions = Column(Text)
    
    # Custo adicional deste componente
    additional_cost = Column(Float, default=0.0)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    composite_product = relationship("Product", foreign_keys=[composite_product_id], back_populates="composite_components")
    component_product = relationship("Product", foreign_keys=[component_product_id], back_populates="used_in_composites")
    
    def __repr__(self):
        return f"<ProductComponent(id={self.id}, composite={self.composite_product_id}, component={self.component_product_id}, qty={self.quantity})>" 