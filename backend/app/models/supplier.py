from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Informações básicas
    name = Column(String(255), nullable=False)
    corporate_name = Column(String(255))
    cnpj = Column(String(18), unique=True)
    cpf = Column(String(14))
    ie = Column(String(20))  # Inscrição Estadual
    im = Column(String(20))  # Inscrição Municipal
    
    # Contato
    email = Column(String(255))
    phone = Column(String(20))
    cellphone = Column(String(20))
    website = Column(String(255))
    
    # Endereço
    address = Column(String(255))
    number = Column(String(10))
    complement = Column(String(100))
    neighborhood = Column(String(100))
    city = Column(String(100))
    state = Column(String(2))
    zip_code = Column(String(10))
    country = Column(String(100), default="Brasil")
    
    # Informações comerciais
    category = Column(String(100))  # Categoria do fornecedor
    payment_terms = Column(String(100))  # Condições de pagamento
    credit_limit = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    
    # Avaliação e status
    rating = Column(Float, default=0.0)
    status = Column(String(20), default="ativo")  # ativo, inativo, bloqueado
    notes = Column(Text)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    # company = relationship("Company", foreign_keys=[company_id])
    contacts = relationship("SupplierContact", back_populates="supplier", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}', company_id='{self.company_id}')>"


class SupplierContact(Base):
    __tablename__ = "supplier_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Informações do contato
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    cellphone = Column(String(20))
    job_function = Column(String(100))  # Cargo/função do contato
    is_primary = Column(Boolean, default=False)  # Se é o contato principal
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    supplier = relationship("Supplier", back_populates="contacts")
    # company = relationship("Company", foreign_keys=[company_id])
    
    def __repr__(self):
        return f"<SupplierContact(id={self.id}, name='{self.name}', supplier_id='{self.supplier_id}', company_id='{self.company_id}')>" 