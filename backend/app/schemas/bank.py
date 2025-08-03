from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class BankBase(BaseModel):
    name: str = Field(..., description="Nome do banco")
    code: str = Field(..., description="Código do banco")
    website: Optional[str] = Field(None, description="Website do banco")
    phone: Optional[str] = Field(None, description="Telefone do banco")
    is_active: bool = Field(True, description="Se o banco está ativo")

class BankCreate(BankBase):
    pass

class BankUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Nome do banco")
    code: Optional[str] = Field(None, description="Código do banco")
    website: Optional[str] = Field(None, description="Website do banco")
    phone: Optional[str] = Field(None, description="Telefone do banco")
    is_active: Optional[bool] = Field(None, description="Se o banco está ativo")

class BankResponse(BankBase):
    id: int
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BankList(BaseModel):
    id: int
    name: str
    code: str
    website: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True 