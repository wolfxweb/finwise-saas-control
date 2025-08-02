from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

class PayableStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PayableType(str, Enum):
    CASH = "cash"
    INSTALLMENT = "installment"

# Schemas para criação
class AccountsPayableCreate(BaseModel):
    description: str = Field(..., description="Descrição da conta a pagar")
    supplier_id: UUID = Field(..., description="ID do fornecedor")
    category_id: Optional[int] = Field(None, description="ID da categoria")
    payable_type: PayableType = Field(PayableType.CASH, description="Tipo de pagamento")
    total_amount: Decimal = Field(..., description="Valor total")
    entry_date: date = Field(..., description="Data de entrada")
    due_date: date = Field(..., description="Data de vencimento")
    notes: Optional[str] = Field(None, description="Observações")
    reference: Optional[str] = Field(None, description="Referência externa")
    status: PayableStatus = Field(PayableStatus.PENDING, description="Status")
    paid_amount: Optional[Decimal] = Field(0, description="Valor pago")
    payment_date: Optional[date] = Field(None, description="Data do pagamento")
    total_installments: int = Field(1, description="Total de parcelas")
    installment_amount: Optional[Decimal] = Field(None, description="Valor da parcela")
    installment_interval_days: int = Field(30, description="Intervalo entre parcelas em dias")
    first_due_date: Optional[date] = Field(None, description="Data de vencimento da primeira parcela")

class AccountsPayableUpdate(BaseModel):
    description: Optional[str] = None
    supplier_id: Optional[UUID] = None
    category_id: Optional[int] = None
    payable_type: Optional[PayableType] = None
    total_amount: Optional[Decimal] = None
    entry_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[PayableStatus] = None
    paid_amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    total_installments: Optional[int] = None
    installment_amount: Optional[Decimal] = None

# Schema para parcelamento
class InstallmentCreate(BaseModel):
    description: str = Field(..., description="Descrição do parcelamento")
    supplier_id: UUID = Field(..., description="ID do fornecedor")
    category_id: Optional[int] = Field(None, description="ID da categoria")
    total_amount: Decimal = Field(..., description="Valor total do parcelamento")
    total_installments: int = Field(..., description="Total de parcelas")
    installment_amount: Optional[Decimal] = Field(None, description="Valor da parcela")
    entry_date: date = Field(..., description="Data de entrada")
    first_due_date: date = Field(..., description="Data de vencimento da primeira parcela")
    installment_interval_days: int = Field(30, description="Intervalo entre parcelas em dias")
    notes: Optional[str] = Field(None, description="Observações")
    reference: Optional[str] = Field(None, description="Referência externa")

# Schemas para resposta
class AccountsPayableResponse(BaseModel):
    id: int
    company_id: UUID
    supplier_id: UUID
    category_id: Optional[int] = None
    description: str
    payable_type: PayableType
    status: PayableStatus
    total_amount: Decimal
    paid_amount: Decimal
    entry_date: date
    due_date: date
    payment_date: Optional[date] = None
    installment_number: int
    total_installments: int
    installment_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    is_overdue: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AccountsPayableList(BaseModel):
    id: int
    description: str
    supplier_id: UUID
    category_id: Optional[int] = None
    payable_type: PayableType
    status: PayableStatus
    total_amount: Decimal
    paid_amount: Decimal
    entry_date: date
    due_date: date
    payment_date: Optional[date] = None
    installment_number: int
    total_installments: int
    installment_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    is_overdue: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InstallmentResponse(BaseModel):
    message: str
    installments_created: int
    total_amount: Decimal
    installment_amount: Decimal

class AccountsPayableSummary(BaseModel):
    total_payable: Decimal
    total_paid: Decimal
    total_overdue: Decimal
    total_pending: Decimal
    overdue_count: int
    pending_count: int
    paid_count: int
    by_status: dict
    by_month: List[dict] 