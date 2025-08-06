from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class PayableCategory(Base):
    __tablename__ = "payable_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("payable_categories.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relacionamentos
    # company = relationship("Company", back_populates="payable_categories")  # Comentado temporariamente
    parent = relationship("PayableCategory", remote_side=[id], backref="children")
    accounts_payable = relationship("AccountsPayable", back_populates="category")

    # Índices
    __table_args__ = (
        Index("ix_payable_categories_company_id", "company_id"),
        Index("ix_payable_categories_parent_id", "parent_id"),
        Index("ix_payable_categories_is_active", "is_active"),
    ) 