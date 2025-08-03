from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text, ForeignKey, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, date

from app.core.database import Base

class PayableStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PayableType(str, enum.Enum):
    CASH = "cash"
    INSTALLMENT = "installment"

class AccountsPayable(Base):
    __tablename__ = "accounts_payable"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("payable_categories.id"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)  # Conta bancária para pagamento
    
    # Informações básicas
    description = Column(String(255), nullable=False)
    payable_type = Column(Enum(PayableType), default=PayableType.CASH)
    status = Column(Enum(PayableStatus), default=PayableStatus.PENDING)
    
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
    is_fixed_cost = Column(String(1), default='N')  # Custo fixo (S/N)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")
    supplier = relationship("Supplier")
    category = relationship("PayableCategory", back_populates="accounts_payable")
    account = relationship("Account")
    
    def __repr__(self):
        return f"<AccountsPayable(id={self.id}, description='{self.description}', amount={self.total_amount})>"
    
    @property
    def is_paid(self):
        """Verifica se está pago"""
        return self.status == PayableStatus.PAID
    
    @property
    def is_overdue(self):
        """Verifica se está vencido"""
        if self.status == PayableStatus.PAID:
            return False
        return self.due_date < date.today()
    
    @property
    def remaining_amount(self):
        """Valor restante a pagar"""
        return self.total_amount - self.paid_amount
    
    @property
    def is_installment(self):
        """Verifica se é parcelado"""
        return self.payable_type == PayableType.INSTALLMENT and self.total_installments > 1
    
    @property
    def is_fixed_cost_bool(self):
        """Converte is_fixed_cost de string para boolean"""
        return self.is_fixed_cost == 'S' if self.is_fixed_cost else False
    
    @property
    def account_name(self):
        """Nome da conta bancária para exibição"""
        if self.account:
            return f"{self.account.bank.name} - {self.account.account_number}"
        return None 