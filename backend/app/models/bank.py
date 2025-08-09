from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from sqlalchemy.dialects import postgresql

class Bank(Base):
    __tablename__ = "banks"
    
    id = Column(Integer, primary_key=True, index=True)
    # CORRIGIDO: Adicionado ForeignKey que estava faltando
    company_id = Column(postgresql.UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(10), nullable=False)
    website = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    accounts = relationship("Account", back_populates="bank")
    
    # Indexes
    __table_args__ = (
        # Index for company_id for faster queries
        # Index for code for faster lookups
        # Index for is_active for filtering
    ) 