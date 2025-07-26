from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID

class CustomerType(str, Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"

class CustomerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: CustomerType = CustomerType.INDIVIDUAL
    status: CustomerStatus = CustomerStatus.ACTIVE
    
    # Documentos
    cpf: Optional[str] = None
    cnpj: Optional[str] = None
    rg: Optional[str] = None
    ie: Optional[str] = None
    
    # Endereço
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    
    # Informações comerciais
    credit_limit: int = 0
    payment_terms: Optional[str] = None
    discount_percentage: int = 0
    
    # Informações de contato
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    
    # Observações
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    status: Optional[CustomerStatus] = None
    
    # Documentos
    cpf: Optional[str] = None
    cnpj: Optional[str] = None
    rg: Optional[str] = None
    ie: Optional[str] = None
    
    # Endereço
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    
    # Informações comerciais
    credit_limit: Optional[int] = None
    payment_terms: Optional[str] = None
    discount_percentage: Optional[int] = None
    
    # Informações de contato
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    
    # Observações
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    company_id: UUID
    document: Optional[str] = None
    is_active: bool
    credit_limit_formatted: str
    discount_percentage_formatted: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CustomerList(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    customer_type: CustomerType
    status: CustomerStatus
    document: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    credit_limit_formatted: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CustomerFilter(BaseModel):
    search: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    status: Optional[CustomerStatus] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_active: Optional[bool] = None 