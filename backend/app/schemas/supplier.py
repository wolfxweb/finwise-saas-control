from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SupplierBase(BaseModel):
    name: str
    corporate_name: Optional[str] = None
    cnpj: Optional[str] = None
    cpf: Optional[str] = None
    ie: Optional[str] = None
    im: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = "Brasil"
    category: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    current_balance: Optional[float] = 0.0
    rating: Optional[float] = 0.0
    status: Optional[str] = "ativo"
    notes: Optional[str] = None

    @validator('cnpj')
    def validate_cnpj(cls, v):
        if v and len(v.replace('.', '').replace('/', '').replace('-', '')) != 14:
            raise ValueError('CNPJ deve ter 14 dígitos')
        return v

    @validator('cpf')
    def validate_cpf(cls, v):
        if v and len(v.replace('.', '').replace('-', '')) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        return v

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    corporate_name: Optional[str] = None
    cnpj: Optional[str] = None
    cpf: Optional[str] = None
    ie: Optional[str] = None
    im: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    current_balance: Optional[float] = None
    rating: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class SupplierInDB(SupplierBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class SupplierResponse(SupplierInDB):
    pass

class SupplierListResponse(BaseModel):
    suppliers: list[SupplierResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

# Schemas para SupplierContact
class SupplierContactBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    job_function: Optional[str] = None
    is_primary: Optional[bool] = False

class SupplierContactCreate(SupplierContactBase):
    pass

class SupplierContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    job_function: Optional[str] = None
    is_primary: Optional[bool] = None

class SupplierContactInDB(SupplierContactBase):
    id: UUID
    supplier_id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class SupplierContactResponse(SupplierContactInDB):
    pass

# Schema atualizado para Supplier com contatos
class SupplierWithContactsResponse(SupplierResponse):
    contacts: List[SupplierContactResponse] = [] 