from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import UUID

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.accounts_payable import AccountsPayable, PayableStatus, PayableType
from app.models.supplier import Supplier
from app.models.payable_category import PayableCategory
from app.models.user import User
from app.schemas.accounts_payable import (
    AccountsPayableCreate, AccountsPayableUpdate, AccountsPayableResponse, 
    AccountsPayableList, AccountsPayableSummary, InstallmentCreate, InstallmentResponse
)

router = APIRouter()

@router.post("/", response_model=AccountsPayableResponse, status_code=status.HTTP_201_CREATED)
def create_accounts_payable(
    payable: AccountsPayableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar uma nova conta a pagar"""
    try:
        # Verificar se o fornecedor existe
        supplier = db.query(Supplier).filter(
            Supplier.id == payable.supplier_id,
            Supplier.company_id == current_user.company_id
        ).first()
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fornecedor não encontrado"
            )
        
        # Verificar se a categoria existe (se fornecida)
        if payable.category_id:
            category = db.query(PayableCategory).filter(
                PayableCategory.id == payable.category_id,
                PayableCategory.company_id == current_user.company_id
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoria não encontrada"
                )
        
        # Calcular valor da parcela se não fornecido
        total_amount = payable.total_amount
        installment_amount = payable.installment_amount
        
        if not installment_amount:
            installment_amount = total_amount
        
        # Criar conta a pagar
        db_payable = AccountsPayable(
            company_id=current_user.company_id,
            supplier_id=payable.supplier_id,
            category_id=payable.category_id,
            description=payable.description,
            payable_type=payable.payable_type,
            total_amount=total_amount,
            entry_date=payable.entry_date,
            due_date=payable.due_date,
            installment_amount=installment_amount,
            installment_number=1,
            total_installments=payable.total_installments,
            notes=payable.notes,
            reference=payable.reference,
            is_fixed_cost='S' if payable.is_fixed_cost else 'N',
            status=payable.status,
            paid_amount=payable.paid_amount or 0,
            payment_date=payable.payment_date
        )
        
        db.add(db_payable)
        db.commit()
        db.refresh(db_payable)
        
        return db_payable
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar conta a pagar: {str(e)}"
        )

@router.post("/installments", response_model=InstallmentResponse, status_code=status.HTTP_201_CREATED)
def create_installments(
    installment_data: InstallmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar parcelamento de contas a pagar"""
    try:
        # Verificar se o fornecedor existe
        supplier = db.query(Supplier).filter(
            Supplier.id == installment_data.supplier_id,
            Supplier.company_id == current_user.company_id
        ).first()
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fornecedor não encontrado"
            )
        
        # Calcular valor da parcela
        total_amount = installment_data.total_amount
        installment_amount = installment_data.installment_amount
        
        if not installment_amount:
            installment_amount = total_amount / installment_data.total_installments
        
        # Criar parcelas
        installments_created = 0
        current_due_date = installment_data.first_due_date
        
        for i in range(installment_data.total_installments):
            db_payable = AccountsPayable(
                company_id=current_user.company_id,
                supplier_id=installment_data.supplier_id,
                category_id=installment_data.category_id,
                description=f"{installment_data.description} - Parcela {i+1}/{installment_data.total_installments}",
                payable_type=PayableType.INSTALLMENT,
                total_amount=installment_amount,  # Valor da parcela individual
                entry_date=installment_data.entry_date,
                due_date=current_due_date,
                installment_amount=installment_amount,
                installment_number=i+1,
                total_installments=installment_data.total_installments,
                notes=installment_data.notes,
                reference=installment_data.reference,
                is_fixed_cost='S' if installment_data.is_fixed_cost else 'N',
                status=PayableStatus.PENDING,
                paid_amount=0
            )
            
            db.add(db_payable)
            installments_created += 1
            
            # Calcular próxima data de vencimento
            current_due_date = current_due_date + timedelta(days=installment_data.installment_interval_days)
        
        db.commit()
        
        return InstallmentResponse(
            message=f"Parcelamento criado com sucesso. {installments_created} parcelas criadas.",
            installments_created=installments_created,
            total_amount=total_amount,
            installment_amount=installment_amount
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar parcelamento: {str(e)}"
        )

@router.get("/", response_model=List[AccountsPayableList])
def get_accounts_payable(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    search: Optional[str] = None,
    status: Optional[PayableStatus] = None,
    supplier_id: Optional[UUID] = None,
    category_id: Optional[int] = None,
    payable_type: Optional[PayableType] = None,
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar contas a pagar com filtros"""
    query = db.query(AccountsPayable).filter(
        AccountsPayable.company_id == current_user.company_id
    )
    
    # Aplicar filtros
    if search:
        search_filter = or_(
            AccountsPayable.description.ilike(f"%{search}%"),
            AccountsPayable.notes.ilike(f"%{search}%"),
            AccountsPayable.reference.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(AccountsPayable.status == status)
    
    if supplier_id:
        query = query.filter(AccountsPayable.supplier_id == supplier_id)
    
    if category_id:
        query = query.filter(AccountsPayable.category_id == category_id)
    
    if payable_type:
        query = query.filter(AccountsPayable.payable_type == payable_type)
    
    if due_date_from:
        query = query.filter(AccountsPayable.due_date >= due_date_from)
    
    if due_date_to:
        query = query.filter(AccountsPayable.due_date <= due_date_to)
    
    # Ordenar por data de vencimento
    query = query.order_by(AccountsPayable.due_date)
    
    # Paginação
    payables = query.offset(skip).limit(limit).all()
    
    return payables

@router.get("/{payable_id}", response_model=AccountsPayableResponse)
def get_accounts_payable_detail(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de uma conta a pagar"""
    payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id,
        AccountsPayable.company_id == current_user.company_id
    ).first()
    
    if not payable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a pagar não encontrada"
        )
    
    return payable

@router.put("/{payable_id}", response_model=AccountsPayableResponse)
def update_accounts_payable(
    payable_id: int,
    payable_update: AccountsPayableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar uma conta a pagar"""
    db_payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id,
        AccountsPayable.company_id == current_user.company_id
    ).first()
    
    if not db_payable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a pagar não encontrada"
        )
    
    # Atualizar campos fornecidos
    update_data = payable_update.dict(exclude_unset=True)
    
    # Tratar campo is_fixed_cost
    if 'is_fixed_cost' in update_data:
        update_data['is_fixed_cost'] = 'S' if update_data['is_fixed_cost'] else 'N'
    
    for field, value in update_data.items():
        setattr(db_payable, field, value)
    
    try:
        db.commit()
        db.refresh(db_payable)
        return db_payable
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar conta a pagar: {str(e)}"
        )

@router.delete("/{payable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accounts_payable(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar uma conta a pagar"""
    db_payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id,
        AccountsPayable.company_id == current_user.company_id
    ).first()
    
    if not db_payable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a pagar não encontrada"
        )
    
    try:
        db.delete(db_payable)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar conta a pagar: {str(e)}"
        )

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_accounts_payable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar todas as contas a pagar da empresa"""
    try:
        db.query(AccountsPayable).filter(
            AccountsPayable.company_id == current_user.company_id
        ).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar contas a pagar: {str(e)}"
        )

@router.get("/reports/summary", response_model=AccountsPayableSummary)
def get_accounts_payable_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo das contas a pagar"""
    payables = db.query(AccountsPayable).filter(
        AccountsPayable.company_id == current_user.company_id
    ).all()
    
    total_payable = sum(p.total_amount for p in payables)
    total_paid = sum(p.paid_amount for p in payables)
    total_overdue = sum(p.remaining_amount for p in payables if p.is_overdue)
    total_pending = sum(p.remaining_amount for p in payables if p.status == PayableStatus.PENDING)
    
    overdue_count = len([p for p in payables if p.is_overdue])
    pending_count = len([p for p in payables if p.status == PayableStatus.PENDING])
    paid_count = len([p for p in payables if p.status == PayableStatus.PAID])
    
    # Agrupar por status
    by_status = {
        "pending": pending_count,
        "paid": paid_count,
        "overdue": overdue_count,
        "cancelled": len([p for p in payables if p.status == PayableStatus.CANCELLED])
    }
    
    # Agrupar por mês
    by_month = []
    for payable in payables:
        month_key = payable.due_date.strftime("%Y-%m")
        existing_month = next((m for m in by_month if m["month"] == month_key), None)
        
        if existing_month:
            existing_month["total"] += float(payable.total_amount)
        else:
            by_month.append({
                "month": month_key,
                "total": float(payable.total_amount)
            })
    
    return AccountsPayableSummary(
        total_payable=total_payable,
        total_paid=total_paid,
        total_overdue=total_overdue,
        total_pending=total_pending,
        overdue_count=overdue_count,
        pending_count=pending_count,
        paid_count=paid_count,
        by_status=by_status,
        by_month=by_month
    ) 