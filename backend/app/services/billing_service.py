from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from uuid import UUID
from decimal import Decimal
import uuid

from ..models.billing import Invoice, InvoiceItem, Payment, BillingSettings
from ..models.company import Company
from ..models.plan import CompanySubscription, Plan
from ..schemas.billing import (
    InvoiceCreate, InvoiceUpdate, PaymentCreate, PaymentUpdate,
    BillingSettingsCreate, BillingSettingsUpdate
)

class BillingService:
    def __init__(self, db: Session):
        self.db = db

    def generate_invoice_number(self) -> str:
        """Gerar número único de fatura"""
        prefix = datetime.now().strftime("%Y%m")
        count = self.db.query(Invoice).filter(
            Invoice.invoice_number.like(f"{prefix}%")
        ).count()
        return f"{prefix}{count + 1:04d}"

    def create_invoice(self, invoice_data: InvoiceCreate) -> Invoice:
        """Criar nova fatura"""
        # Gerar número da fatura
        invoice_number = self.generate_invoice_number()
        
        # Criar fatura
        invoice = Invoice(
            **invoice_data.dict(exclude={'items'}),
            invoice_number=invoice_number
        )
        self.db.add(invoice)
        self.db.flush()  # Para obter o ID da fatura
        
        # Criar itens da fatura
        for item_data in invoice_data.items:
            item = InvoiceItem(
                invoice_id=invoice.id,
                **item_data.dict()
            )
            self.db.add(item)
        
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def get_invoice(self, invoice_id: UUID) -> Optional[Invoice]:
        """Obter fatura por ID"""
        return self.db.query(Invoice).filter(Invoice.id == invoice_id).first()

    def get_company_invoices(self, company_id: UUID) -> List[Invoice]:
        """Obter todas as faturas de uma empresa"""
        return self.db.query(Invoice).filter(
            Invoice.company_id == company_id
        ).order_by(Invoice.created_at.desc()).all()

    def update_invoice(self, invoice_id: UUID, invoice_data: InvoiceUpdate) -> Optional[Invoice]:
        """Atualizar fatura"""
        invoice = self.get_invoice(invoice_id)
        if not invoice:
            return None
        
        for field, value in invoice_data.dict(exclude_unset=True).items():
            setattr(invoice, field, value)
        
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def create_payment(self, payment_data: PaymentCreate) -> Payment:
        """Criar novo pagamento"""
        payment = Payment(**payment_data.dict())
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_invoice_payments(self, invoice_id: UUID) -> List[Payment]:
        """Obter pagamentos de uma fatura"""
        return self.db.query(Payment).filter(
            Payment.invoice_id == invoice_id
        ).order_by(Payment.created_at.desc()).all()

    def update_payment(self, payment_id: UUID, payment_data: PaymentUpdate) -> Optional[Payment]:
        """Atualizar pagamento"""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return None
        
        for field, value in payment_data.dict(exclude_unset=True).items():
            setattr(payment, field, value)
        
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_billing_settings(self, company_id: UUID) -> Optional[BillingSettings]:
        """Obter configurações de cobrança de uma empresa"""
        return self.db.query(BillingSettings).filter(
            BillingSettings.company_id == company_id
        ).first()

    def create_or_update_billing_settings(self, company_id: UUID, settings_data: BillingSettingsUpdate) -> BillingSettings:
        """Criar ou atualizar configurações de cobrança"""
        settings = self.get_billing_settings(company_id)
        
        if settings:
            # Atualizar configurações existentes
            for field, value in settings_data.dict(exclude_unset=True).items():
                setattr(settings, field, value)
        else:
            # Criar novas configurações
            settings = BillingSettings(
                company_id=company_id,
                **settings_data.dict()
            )
            self.db.add(settings)
        
        self.db.commit()
        self.db.refresh(settings)
        return settings

    def generate_monthly_invoices(self) -> List[Invoice]:
        """Gerar faturas mensais para todas as empresas ativas"""
        today = date.today()
        invoices_created = []
        
        # Buscar todas as empresas ativas com assinaturas
        active_subscriptions = self.db.query(CompanySubscription).filter(
            CompanySubscription.status == "active"
        ).all()
        
        for subscription in active_subscriptions:
            # Verificar se já existe fatura para este mês
            existing_invoice = self.db.query(Invoice).filter(
                and_(
                    Invoice.subscription_id == subscription.id,
                    Invoice.billing_period_start >= today.replace(day=1),
                    Invoice.billing_period_end <= (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                )
            ).first()
            
            if existing_invoice:
                continue
            
            # Obter configurações de cobrança da empresa
            billing_settings = self.get_billing_settings(subscription.company_id)
            billing_day = billing_settings.billing_day if billing_settings else 1
            
            # Calcular período de cobrança
            billing_start = today.replace(day=1)
            billing_end = (billing_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            due_date = billing_start.replace(day=billing_day)
            
            # Se o dia de cobrança já passou, usar o próximo mês
            if due_date < today:
                due_date = (billing_start + timedelta(days=32)).replace(day=billing_day)
            
            # Criar fatura
            invoice_data = InvoiceCreate(
                company_id=subscription.company_id,
                subscription_id=subscription.id,
                invoice_number="",  # Será gerado automaticamente
                billing_period_start=billing_start,
                billing_period_end=billing_end,
                due_date=due_date,
                issue_date=today,
                subtotal=subscription.total_price,
                total_amount=subscription.total_price,
                items=[
                    {
                        "description": f"Plano {subscription.plan.name if subscription.plan else 'Customizado'}",
                        "quantity": 1,
                        "unit_price": subscription.total_price,
                        "total_price": subscription.total_price
                    }
                ]
            )
            
            invoice = self.create_invoice(invoice_data)
            invoices_created.append(invoice)
        
        return invoices_created

    def get_overdue_invoices(self) -> List[Dict[str, Any]]:
        """Obter faturas vencidas"""
        today = date.today()
        
        overdue_invoices = self.db.query(
            Invoice.id,
            Invoice.invoice_number,
            Invoice.total_amount,
            Invoice.due_date,
            Company.name.label('company_name'),
            Company.email.label('company_email')
        ).join(Company).filter(
            and_(
                Invoice.status == "pending",
                Invoice.due_date < today
            )
        ).all()
        
        result = []
        for invoice in overdue_invoices:
            days_overdue = (today - invoice.due_date).days
            result.append({
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "company_name": invoice.company_name,
                "company_email": invoice.company_email,
                "total_amount": invoice.total_amount,
                "due_date": invoice.due_date,
                "days_overdue": days_overdue
            })
        
        return result

    def get_billing_summary(self) -> Dict[str, Any]:
        """Obter resumo de cobrança"""
        today = date.today()
        
        # Total de faturas
        total_invoices = self.db.query(Invoice).count()
        
        # Faturas pagas
        paid_invoices = self.db.query(Invoice).filter(
            Invoice.status == "paid"
        ).count()
        
        # Faturas pendentes
        pending_invoices = self.db.query(Invoice).filter(
            Invoice.status == "pending"
        ).count()
        
        # Faturas vencidas
        overdue_invoices = self.db.query(Invoice).filter(
            and_(
                Invoice.status == "pending",
                Invoice.due_date < today
            )
        ).count()
        
        # Receita total
        total_revenue = self.db.query(func.sum(Invoice.total_amount)).filter(
            Invoice.status == "paid"
        ).scalar() or Decimal('0')
        
        # Receita pendente
        pending_revenue = self.db.query(func.sum(Invoice.total_amount)).filter(
            Invoice.status == "pending"
        ).scalar() or Decimal('0')
        
        # Receita vencida
        overdue_revenue = self.db.query(func.sum(Invoice.total_amount)).filter(
            and_(
                Invoice.status == "pending",
                Invoice.due_date < today
            )
        ).scalar() or Decimal('0')
        
        return {
            "total_invoices": total_invoices,
            "paid_invoices": paid_invoices,
            "pending_invoices": pending_invoices,
            "overdue_invoices": overdue_invoices,
            "total_revenue": total_revenue,
            "pending_revenue": pending_revenue,
            "overdue_revenue": overdue_revenue
        }

    def mark_invoice_as_paid(self, invoice_id: UUID, payment_method: str = "manual") -> Optional[Invoice]:
        """Marcar fatura como paga"""
        invoice = self.get_invoice(invoice_id)
        if not invoice:
            return None
        
        invoice.status = "paid"
        invoice.payment_method = payment_method
        invoice.payment_date = date.today()
        
        # Criar registro de pagamento
        payment = Payment(
            invoice_id=invoice_id,
            payment_method=payment_method,
            payment_date=date.today(),
            amount=invoice.total_amount,
            status="completed"
        )
        self.db.add(payment)
        
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def get_recent_invoices(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Obter faturas recentes"""
        recent_invoices = self.db.query(
            Invoice.id,
            Invoice.invoice_number,
            Invoice.total_amount,
            Invoice.status,
            Invoice.due_date,
            Invoice.issue_date,
            Invoice.payment_date,
            Company.name.label('company_name'),
            Company.id.label('company_id')
        ).join(Company).order_by(
            Invoice.created_at.desc()
        ).limit(limit).all()
        
        return [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "company_name": invoice.company_name,
                "company_id": invoice.company_id,
                "total_amount": invoice.total_amount,
                "status": invoice.status,
                "due_date": invoice.due_date,
                "issue_date": invoice.issue_date,
                "payment_date": invoice.payment_date
            }
            for invoice in recent_invoices
        ] 