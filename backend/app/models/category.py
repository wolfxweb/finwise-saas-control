from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Informações básicas
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    code = Column(String(20), unique=True, index=True)  # Código único da categoria
    
    # Hierarquia
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Configurações
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)  # Ordem de exibição
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")
    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    products = relationship("Product", back_populates="category_obj")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', company_id={self.company_id})>" 