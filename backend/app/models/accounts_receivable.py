from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid

class ReceivableStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class ReceivableType(str, enum.Enum):
    CASH = "cash"
    INSTALLMENT = "installment"

class AccountsReceivable(Base):
    __tablename__ = "accounts_receivable"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    # Informações básicas
    description = Column(String(255), nullable=False)
    receivable_type = Column(Enum(ReceivableType), default=ReceivableType.CASH)
    status = Column(Enum(ReceivableStatus), default=ReceivableStatus.PENDING)
    
    # Valores
    total_amount = Column(Numeric(10, 2), nullable=False)  # Valor total
    paid_amount = Column(Numeric(10, 2), default=0)  # Valor pago
    
    # Datas
    entry_date = Column(Date, nullable=False, default=func.current_date())
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    
    # Parcelamento
    installment_number = Column(Integer, default=1)  # Número da parcela
    total_installments = Column(Integer, default=1)  # Total de parcelas
    installment_amount = Column(Numeric(10, 2), nullable=True)  # Valor da parcela
    
    # Informações adicionais
    notes = Column(Text, nullable=True)
    reference = Column(String(100), nullable=True)  # Referência externa
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")
    customer = relationship("Customer")
    category = relationship("Category")
    account = relationship("Account")
    
    def __repr__(self):
        return f"<AccountsReceivable(id={self.id}, description='{self.description}', amount={self.total_amount})>"
    
    @property
    def is_paid(self):
        """Verifica se está pago"""
        return self.status == ReceivableStatus.PAID
    
    @property
    def is_overdue(self):
        """Verifica se está vencido"""
        from datetime import date
        return self.status == ReceivableStatus.PENDING and self.due_date < date.today()
    
    @property
    def remaining_amount(self):
        """Valor restante a pagar"""
        return float(self.total_amount - self.paid_amount)
    
    @property
    def amount_formatted(self):
        """Valor formatado"""
        return f"R$ {self.total_amount:,.2f}"
    
    @property
    def paid_amount_formatted(self):
        """Valor pago formatado"""
        return f"R$ {self.paid_amount:,.2f}"
    
    @property
    def remaining_amount_formatted(self):
        """Valor restante formatado"""
        return f"R$ {self.remaining_amount:,.2f}"
    
    @property
    def installment_info(self):
        """Informações do parcelamento"""
        if self.total_installments > 1:
            return f"{self.installment_number}/{self.total_installments}"
        return "À vista"
    
    @property
    def customer_name(self):
        """Nome do cliente"""
        return self.customer.name if self.customer else ""
    
    @property
    def category_name(self):
        """Nome da categoria"""
        return self.category.name if self.category else ""
    
    @property
    def account_name(self):
        """Nome da conta bancária"""
        if self.account:
            return f"{self.account.bank.name} - {self.account.account_number} ({self.account.holder_name})"
        return "" 