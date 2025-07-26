from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from uuid import UUID

class ReceivableStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class ReceivableType(str, Enum):
    CASH = "cash"
    INSTALLMENT = "installment"

class AccountsReceivableBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    customer_id: int
    category_id: Optional[int] = None
    receivable_type: ReceivableType = ReceivableType.CASH
    total_amount: float = Field(..., gt=0)
    entry_date: date
    due_date: date
    notes: Optional[str] = None
    reference: Optional[str] = None

class AccountsReceivableCreate(AccountsReceivableBase):
    # Para parcelamento
    total_installments: int = Field(1, ge=1, le=60)
    installment_amount: Optional[float] = None  # Se fornecido, é o valor da parcela
    installment_interval_days: int = Field(30, ge=1, le=365)  # Intervalo entre parcelas

class AccountsReceivableUpdate(BaseModel):
    description: Optional[str] = None
    customer_id: Optional[int] = None
    category_id: Optional[int] = None
    receivable_type: Optional[ReceivableType] = None
    total_amount: Optional[float] = None
    entry_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[ReceivableStatus] = None
    paid_amount: Optional[float] = None
    payment_date: Optional[date] = None

class AccountsReceivableResponse(AccountsReceivableBase):
    id: int
    company_id: UUID
    status: ReceivableStatus
    paid_amount: float
    payment_date: Optional[date] = None
    installment_number: int
    total_installments: int
    installment_amount: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Campos calculados
    remaining_amount: float
    amount_formatted: str
    paid_amount_formatted: str
    remaining_amount_formatted: str
    installment_info: str
    is_paid: bool
    is_overdue: bool
    
    # Relacionamentos
    customer_name: str
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class AccountsReceivableList(BaseModel):
    id: int
    description: str
    customer_name: str
    total_amount: float
    paid_amount: float
    remaining_amount: float
    due_date: date
    status: ReceivableStatus
    installment_info: str
    is_overdue: bool
    created_at: datetime
    # Campos de parcelamento
    installment_number: int
    total_installments: int
    installment_amount: Optional[float] = None
    
    class Config:
        from_attributes = True

class AccountsReceivableSummary(BaseModel):
    total_receivable: float
    total_paid: float
    total_overdue: float
    total_pending: float
    overdue_count: int
    pending_count: int
    paid_count: int
    by_status: dict
    by_month: List[dict]

class InstallmentCreate(BaseModel):
    description: str
    customer_id: int
    category_id: Optional[int] = None
    total_amount: float
    total_installments: int = Field(..., ge=2, le=60)
    installment_amount: Optional[float] = None
    entry_date: date
    first_due_date: date
    installment_interval_days: int = Field(30, ge=1, le=365)
    notes: Optional[str] = None
    reference: Optional[str] = None

class InstallmentResponse(BaseModel):
    installments: List[AccountsReceivableResponse]
    total_amount: float
    total_installments: int
    installment_amount: float
    
    class Config:
        from_attributes = True 