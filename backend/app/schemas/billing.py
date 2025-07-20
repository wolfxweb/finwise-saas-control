from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

# Schemas para Invoice
class InvoiceItemBase(BaseModel):
    description: str
    quantity: int = 1
    unit_price: Decimal
    total_price: Decimal
    module_id: Optional[UUID] = None

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: UUID
    invoice_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    company_id: UUID
    subscription_id: UUID
    invoice_number: str
    billing_period_start: date
    billing_period_end: date
    due_date: date
    issue_date: date
    subtotal: Decimal
    tax_amount: Decimal = 0
    discount_amount: Decimal = 0
    total_amount: Decimal
    status: str = "pending"
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    billing_address: Optional[str] = None
    billing_email: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    billing_address: Optional[str] = None
    billing_email: Optional[str] = None

class Invoice(InvoiceBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[InvoiceItem] = []

    class Config:
        from_attributes = True

# Schemas para Payment
class PaymentBase(BaseModel):
    invoice_id: UUID
    payment_method: str
    payment_date: date
    amount: Decimal
    status: str = "pending"
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class Payment(PaymentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schemas para BillingSettings
class BillingSettingsBase(BaseModel):
    company_id: UUID
    billing_day: int = 1
    grace_period_days: int = 5
    auto_suspend: bool = True
    default_payment_method: Optional[str] = None
    credit_card_last4: Optional[str] = None
    credit_card_brand: Optional[str] = None
    credit_card_expiry: Optional[str] = None
    send_invoice_emails: bool = True
    send_payment_reminders: bool = True

class BillingSettingsCreate(BillingSettingsBase):
    pass

class BillingSettingsUpdate(BaseModel):
    billing_day: Optional[int] = None
    grace_period_days: Optional[int] = None
    auto_suspend: Optional[bool] = None
    default_payment_method: Optional[str] = None
    credit_card_last4: Optional[str] = None
    credit_card_brand: Optional[str] = None
    credit_card_expiry: Optional[str] = None
    send_invoice_emails: Optional[bool] = None
    send_payment_reminders: Optional[bool] = None

class BillingSettings(BillingSettingsBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schemas para relatórios e dashboards
class BillingSummary(BaseModel):
    total_invoices: int
    paid_invoices: int
    pending_invoices: int
    overdue_invoices: int
    total_revenue: Decimal
    pending_revenue: Decimal
    overdue_revenue: Decimal

class InvoiceWithCompany(BaseModel):
    id: UUID
    invoice_number: str
    company_name: str
    company_id: UUID
    total_amount: Decimal
    status: str
    due_date: date
    issue_date: date
    payment_date: Optional[date] = None

    class Config:
        from_attributes = True

class OverdueInvoice(BaseModel):
    id: UUID
    invoice_number: str
    company_name: str
    company_id: UUID
    total_amount: Decimal
    due_date: date
    days_overdue: int
    company_email: str

    class Config:
        from_attributes = True 