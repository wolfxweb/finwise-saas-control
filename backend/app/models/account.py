from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from sqlalchemy.dialects import postgresql

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(postgresql.UUID(as_uuid=True), nullable=False)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    account_type = Column(String(20), nullable=False)  # checking, savings, investment, credit
    account_number = Column(String(50), nullable=False)
    agency = Column(String(20), nullable=False)
    holder_name = Column(String(255), nullable=False)
    balance = Column(Numeric(15, 2), default=0)
    limit = Column(Numeric(15, 2), default=0)
    available_balance = Column(Numeric(15, 2), default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bank = relationship("Bank", back_populates="accounts")
    
    # Indexes
    __table_args__ = (
        # Index for company_id for faster queries
        # Index for bank_id for faster lookups
        # Index for account_type for filtering
        # Index for is_active for filtering
    ) 