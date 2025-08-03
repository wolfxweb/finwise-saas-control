from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class AccountBase(BaseModel):
    bank_id: int = Field(..., description="ID do banco")
    account_type: str = Field(..., description="Tipo da conta (checking, savings, investment, credit)")
    account_number: str = Field(..., description="Número da conta")
    agency: str = Field(..., description="Agência")
    holder_name: str = Field(..., description="Nome do titular")
    balance: Decimal = Field(0, description="Saldo atual")
    limit: Decimal = Field(0, description="Limite de crédito")
    is_active: bool = Field(True, description="Se a conta está ativa")
    notes: Optional[str] = Field(None, description="Observações")

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    bank_id: Optional[int] = Field(None, description="ID do banco")
    account_type: Optional[str] = Field(None, description="Tipo da conta")
    account_number: Optional[str] = Field(None, description="Número da conta")
    agency: Optional[str] = Field(None, description="Agência")
    holder_name: Optional[str] = Field(None, description="Nome do titular")
    balance: Optional[Decimal] = Field(None, description="Saldo atual")
    limit: Optional[Decimal] = Field(None, description="Limite de crédito")
    is_active: Optional[bool] = Field(None, description="Se a conta está ativa")
    notes: Optional[str] = Field(None, description="Observações")

class AccountResponse(AccountBase):
    id: int
    company_id: UUID
    available_balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AccountList(BaseModel):
    id: int
    bank_id: int
    bank_name: str
    account_type: str
    account_number: str
    agency: str
    holder_name: str
    balance: Decimal
    limit: Decimal
    available_balance: Decimal
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountSummary(BaseModel):
    total_accounts: int
    total_balance: Decimal
    total_limit: Decimal
    total_available: Decimal
    active_accounts: int
    inactive_accounts: int 