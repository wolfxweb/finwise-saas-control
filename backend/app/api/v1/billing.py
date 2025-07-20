from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...core.database import get_db
from ..v1.auth import get_current_user
from ..v1.admin import verify_admin_access
from ...models.user import User
from ...services.billing_service import BillingService
from ...schemas.billing import (
    Invoice, InvoiceCreate, InvoiceUpdate, Payment, PaymentCreate, PaymentUpdate,
    BillingSettings, BillingSettingsUpdate, BillingSummary, InvoiceWithCompany, OverdueInvoice
)

router = APIRouter()

# Endpoints para Faturas
@router.get("/invoices", response_model=List[InvoiceWithCompany])
def get_invoices(
    status_filter: Optional[str] = Query(None, description="Filtrar por status: pending, paid, overdue"),
    company_id: Optional[UUID] = Query(None, description="Filtrar por empresa"),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Listar faturas"""
    billing_service = BillingService(db)
    
    if company_id:
        invoices = billing_service.get_company_invoices(company_id)
    else:
        # Para admin, buscar todas as faturas
        invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    
    # Converter para formato com nome da empresa
    result = []
    for invoice in invoices:
        company = db.query(User).filter(User.id == invoice.company_id).first()
        result.append({
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "company_name": company.name if company else "Empresa não encontrada",
            "company_id": invoice.company_id,
            "total_amount": invoice.total_amount,
            "status": invoice.status,
            "due_date": invoice.due_date,
            "issue_date": invoice.issue_date,
            "payment_date": invoice.payment_date
        })
    
    # Aplicar filtro de status se fornecido
    if status_filter:
        if status_filter == "overdue":
            from datetime import date
            today = date.today()
            result = [inv for inv in result if inv["status"] == "pending" and inv["due_date"] < today]
        else:
            result = [inv for inv in result if inv["status"] == status_filter]
    
    return result

@router.get("/invoices/{invoice_id}", response_model=Invoice)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter fatura específica"""
    billing_service = BillingService(db)
    invoice = billing_service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )
    
    return invoice

@router.post("/invoices", response_model=Invoice)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Criar nova fatura"""
    billing_service = BillingService(db)
    invoice = billing_service.create_invoice(invoice_data)
    return invoice

@router.put("/invoices/{invoice_id}", response_model=Invoice)
def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar fatura"""
    billing_service = BillingService(db)
    invoice = billing_service.update_invoice(invoice_id, invoice_data)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )
    
    return invoice

@router.post("/invoices/{invoice_id}/mark-paid")
def mark_invoice_as_paid(
    invoice_id: UUID,
    payment_method: str = Query("manual", description="Método de pagamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Marcar fatura como paga"""
    billing_service = BillingService(db)
    invoice = billing_service.mark_invoice_as_paid(invoice_id, payment_method)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )
    
    return {"message": "Fatura marcada como paga com sucesso"}

# Endpoints para Pagamentos
@router.get("/invoices/{invoice_id}/payments", response_model=List[Payment])
def get_invoice_payments(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter pagamentos de uma fatura"""
    billing_service = BillingService(db)
    payments = billing_service.get_invoice_payments(invoice_id)
    return payments

@router.post("/payments", response_model=Payment)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Criar novo pagamento"""
    billing_service = BillingService(db)
    payment = billing_service.create_payment(payment_data)
    return payment

@router.put("/payments/{payment_id}", response_model=Payment)
def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar pagamento"""
    billing_service = BillingService(db)
    payment = billing_service.update_payment(payment_id, payment_data)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    return payment

# Endpoints para Configurações de Cobrança
@router.get("/companies/{company_id}/billing-settings", response_model=BillingSettings)
def get_billing_settings(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter configurações de cobrança de uma empresa"""
    billing_service = BillingService(db)
    settings = billing_service.get_billing_settings(company_id)
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configurações de cobrança não encontradas"
        )
    
    return settings

@router.post("/companies/{company_id}/billing-settings", response_model=BillingSettings)
def create_or_update_billing_settings(
    company_id: UUID,
    settings_data: BillingSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Criar ou atualizar configurações de cobrança"""
    billing_service = BillingService(db)
    settings = billing_service.create_or_update_billing_settings(company_id, settings_data)
    return settings

# Endpoints para Relatórios e Dashboards
@router.get("/billing/summary", response_model=BillingSummary)
def get_billing_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter resumo de cobrança"""
    billing_service = BillingService(db)
    summary = billing_service.get_billing_summary()
    return summary

@router.get("/billing/overdue", response_model=List[OverdueInvoice])
def get_overdue_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter faturas vencidas"""
    billing_service = BillingService(db)
    overdue_invoices = billing_service.get_overdue_invoices()
    return overdue_invoices

@router.get("/billing/recent", response_model=List[InvoiceWithCompany])
def get_recent_invoices(
    limit: int = Query(10, description="Número de faturas recentes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter faturas recentes"""
    billing_service = BillingService(db)
    recent_invoices = billing_service.get_recent_invoices(limit)
    return recent_invoices

# Endpoints para Automação
@router.post("/billing/generate-monthly-invoices")
def generate_monthly_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Gerar faturas mensais para todas as empresas ativas"""
    billing_service = BillingService(db)
    invoices_created = billing_service.generate_monthly_invoices()
    
    return {
        "message": f"{len(invoices_created)} faturas geradas com sucesso",
        "invoices_created": len(invoices_created)
    }

# Endpoints para Empresas (acesso limitado)
@router.get("/company/invoices", response_model=List[Invoice])
def get_company_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter faturas da empresa do usuário atual"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não está associado a uma empresa"
        )
    
    billing_service = BillingService(db)
    invoices = billing_service.get_company_invoices(current_user.company_id)
    return invoices

@router.get("/company/billing-settings", response_model=BillingSettings)
def get_company_billing_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter configurações de cobrança da empresa do usuário atual"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não está associado a uma empresa"
        )
    
    billing_service = BillingService(db)
    settings = billing_service.get_billing_settings(current_user.company_id)
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configurações de cobrança não encontradas"
        )
    
    return settings

@router.post("/company/billing-settings", response_model=BillingSettings)
def update_company_billing_settings(
    settings_data: BillingSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar configurações de cobrança da empresa do usuário atual"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não está associado a uma empresa"
        )
    
    billing_service = BillingService(db)
    settings = billing_service.create_or_update_billing_settings(
        current_user.company_id, 
        settings_data
    )
    return settings 