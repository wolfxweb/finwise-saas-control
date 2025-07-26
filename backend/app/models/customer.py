from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid

class CustomerType(str, enum.Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"

class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Informações básicas
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(20))
    customer_type = Column(Enum(CustomerType), default=CustomerType.INDIVIDUAL)
    status = Column(Enum(CustomerStatus), default=CustomerStatus.ACTIVE)
    
    # Documentos
    cpf = Column(String(14))  # Para pessoa física
    cnpj = Column(String(18))  # Para pessoa jurídica
    rg = Column(String(20))  # Para pessoa física
    ie = Column(String(20))  # Inscrição Estadual para PJ
    
    # Endereço
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(2))
    zip_code = Column(String(10))
    country = Column(String(100), default="Brasil")
    
    # Informações comerciais
    credit_limit = Column(Integer, default=0)  # Limite de crédito em centavos
    payment_terms = Column(String(50))  # Condições de pagamento
    discount_percentage = Column(Integer, default=0)  # Desconto padrão em centavos
    
    # Informações de contato
    contact_person = Column(String(255))  # Pessoa de contato
    contact_phone = Column(String(20))
    contact_email = Column(String(255))
    
    # Observações
    notes = Column(Text)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("Company")  # Removido back_populates temporariamente
    # orders = relationship("Order", back_populates="customer")  # Comentado até criar o modelo Order
    # invoices = relationship("Invoice", back_populates="customer")  # Comentado até criar o modelo Invoice
    
    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}', email='{self.email}')>"
    
    @property
    def document(self):
        """Retorna o documento principal (CPF ou CNPJ)"""
        return self.cpf if self.customer_type == CustomerType.INDIVIDUAL else self.cnpj
    
    @property
    def is_active(self):
        """Verifica se o cliente está ativo"""
        return self.status == CustomerStatus.ACTIVE
    
    @property
    def credit_limit_formatted(self):
        """Retorna o limite de crédito formatado"""
        return f"R$ {self.credit_limit / 100:.2f}" if self.credit_limit else "R$ 0,00"
    
    @property
    def discount_percentage_formatted(self):
        """Retorna o desconto formatado"""
        return f"{self.discount_percentage / 100:.1f}%" if self.discount_percentage else "0%" 