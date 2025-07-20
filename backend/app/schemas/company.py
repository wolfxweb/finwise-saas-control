from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CompanyBase(BaseModel):
    name: str
    corporate_name: str
    cnpj: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    corporate_name: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: Optional[str] = None
    plan_type: Optional[str] = None

class Company(CompanyBase):
    id: UUID
    status: str
    plan_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    cnpj: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class BranchCreate(BranchBase):
    company_id: UUID

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: Optional[str] = None

class Branch(BranchBase):
    id: UUID
    company_id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CompanyWithBranches(Company):
    branches: List[Branch] = []

class CompanyProfile(BaseModel):
    id: str
    name: str
    corporate_name: str
    cnpj: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: str
    plan_type: str
    created_at: str
    updated_at: Optional[str] = None 