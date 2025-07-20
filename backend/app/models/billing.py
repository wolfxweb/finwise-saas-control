from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Numeric, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid
from datetime import datetime, timedelta

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("company_subscriptions.id"), nullable=False)
    
    # Informações da fatura
    invoice_number = Column(String(50), unique=True, nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    issue_date = Column(Date, nullable=False)
    
    # Valores
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    # Status da fatura
    status = Column(String(20), default="pending")  # pending, paid, overdue, cancelled
    payment_method = Column(String(50))  # credit_card, bank_transfer, etc.
    payment_date = Column(Date)
    
    # Informações de cobrança
    billing_address = Column(Text)
    billing_email = Column(String(255))
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")
    subscription = relationship("CompanySubscription")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=True)
    
    # Descrição do item
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    invoice = relationship("Invoice", back_populates="items")
    module = relationship("Module")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    
    # Informações do pagamento
    payment_method = Column(String(50), nullable=False)  # credit_card, bank_transfer, etc.
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Status do pagamento
    status = Column(String(20), default="pending")  # pending, completed, failed, refunded
    transaction_id = Column(String(100))  # ID da transação do gateway de pagamento
    
    # Informações adicionais
    notes = Column(Text)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    invoice = relationship("Invoice", back_populates="payments")

class BillingSettings(Base):
    __tablename__ = "billing_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Configurações de cobrança
    billing_day = Column(Integer, default=1)  # Dia do mês para cobrança
    grace_period_days = Column(Integer, default=5)  # Período de carência
    auto_suspend = Column(Boolean, default=True)  # Suspender automaticamente após vencimento
    
    # Informações de pagamento
    default_payment_method = Column(String(50))
    credit_card_last4 = Column(String(4))
    credit_card_brand = Column(String(20))
    credit_card_expiry = Column(String(7))  # MM/YYYY
    
    # Configurações de notificação
    send_invoice_emails = Column(Boolean, default=True)
    send_payment_reminders = Column(Boolean, default=True)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company") 