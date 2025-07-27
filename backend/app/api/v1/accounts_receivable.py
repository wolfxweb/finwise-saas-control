from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.accounts_receivable import AccountsReceivable, ReceivableStatus, ReceivableType
from app.models.customer import Customer
from app.models.category import Category
from app.models.user import User
from app.schemas.accounts_receivable import (
    AccountsReceivableCreate, AccountsReceivableUpdate, AccountsReceivableResponse, 
    AccountsReceivableList, AccountsReceivableSummary, InstallmentCreate, InstallmentResponse
)

router = APIRouter()

@router.post("/", response_model=AccountsReceivableResponse, status_code=status.HTTP_201_CREATED)
def create_accounts_receivable(
    receivable: AccountsReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar uma nova conta a receber"""
    try:
        # Verificar se o cliente existe
        customer = db.query(Customer).filter(
            and_(
                Customer.id == receivable.customer_id,
                Customer.company_id == current_user.company_id
            )
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )
        
        # Verificar se a categoria existe (se fornecida)
        if receivable.category_id:
            category = db.query(Category).filter(
                and_(
                    Category.id == receivable.category_id,
                    Category.company_id == current_user.company_id
                )
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoria não encontrada"
                )
        
        # Calcular valor da parcela se necessário
        installment_amount = receivable.installment_amount
        if receivable.receivable_type == ReceivableType.INSTALLMENT and receivable.total_installments > 1:
            if installment_amount:
                # Se fornecido o valor da parcela, calcular o total
                total_amount = installment_amount * receivable.total_installments
            else:
                # Se fornecido o total, calcular o valor da parcela
                total_amount = receivable.total_amount
                installment_amount = total_amount / receivable.total_installments
        else:
            total_amount = receivable.total_amount
            installment_amount = total_amount
        
        # Criar conta a receber
        db_receivable = AccountsReceivable(
            company_id=current_user.company_id,
            customer_id=receivable.customer_id,
            category_id=receivable.category_id,
            description=receivable.description,
            receivable_type=receivable.receivable_type,
            total_amount=total_amount,
            entry_date=receivable.entry_date,
            due_date=receivable.due_date,
            installment_amount=installment_amount,
            installment_number=1,
            total_installments=receivable.total_installments,
            notes=receivable.notes,
            reference=receivable.reference,
            status=receivable.status,
            paid_amount=receivable.paid_amount or 0,
            payment_date=receivable.payment_date
        )
        
        db.add(db_receivable)
        db.commit()
        db.refresh(db_receivable)
        
        return db_receivable
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar conta a receber: {str(e)}"
        )

@router.post("/installments", response_model=InstallmentResponse, status_code=status.HTTP_201_CREATED)
def create_installments(
    installment_data: InstallmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar parcelamento de conta a receber"""
    try:
        # Verificar se o cliente existe
        customer = db.query(Customer).filter(
            and_(
                Customer.id == installment_data.customer_id,
                Customer.company_id == current_user.company_id
            )
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )
        
        # Verificar se a categoria existe (se fornecida)
        if installment_data.category_id:
            category = db.query(Category).filter(
                and_(
                    Category.id == installment_data.category_id,
                    Category.company_id == current_user.company_id
                )
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoria não encontrada"
                )
        
        # Calcular valor da parcela
        if installment_data.installment_amount:
            # Se fornecido o valor da parcela, calcular o total
            total_amount = installment_data.installment_amount * installment_data.total_installments
            installment_amount = installment_data.installment_amount
        else:
            # Se fornecido o total, calcular o valor da parcela
            total_amount = installment_data.total_amount
            installment_amount = total_amount / installment_data.total_installments
        
        # Criar parcelas
        installments = []
        current_due_date = installment_data.first_due_date
        
        for i in range(installment_data.total_installments):
            # Ajustar valor da última parcela para evitar diferenças de centavos
            if i == installment_data.total_installments - 1:
                remaining_amount = total_amount - (installment_amount * i)
                current_installment_amount = remaining_amount
            else:
                current_installment_amount = installment_amount
            
            db_installment = AccountsReceivable(
                company_id=current_user.company_id,
                customer_id=installment_data.customer_id,
                category_id=installment_data.category_id,
                description=f"{installment_data.description} - Parcela {i+1}/{installment_data.total_installments}",
                receivable_type=ReceivableType.INSTALLMENT,
                total_amount=current_installment_amount,
                entry_date=installment_data.entry_date,
                due_date=current_due_date,
                installment_amount=current_installment_amount,
                installment_number=i+1,
                total_installments=installment_data.total_installments,
                notes=installment_data.notes,
                reference=installment_data.reference
            )
            
            db.add(db_installment)
            installments.append(db_installment)
            
            # Calcular próxima data de vencimento
            current_due_date += timedelta(days=installment_data.installment_interval_days)
        
        db.commit()
        
        # Refresh todos os objetos
        for installment in installments:
            db.refresh(installment)
        
        return InstallmentResponse(
            installments=installments,
            total_amount=total_amount,
            total_installments=installment_data.total_installments,
            installment_amount=installment_amount
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar parcelamento: {str(e)}"
        )

@router.get("/", response_model=List[AccountsReceivableList])
def get_accounts_receivable(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[ReceivableStatus] = None,
    customer_id: Optional[int] = None,
    category_id: Optional[int] = None,
    receivable_type: Optional[ReceivableType] = None,
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar contas a receber com filtros"""
    query = db.query(AccountsReceivable).filter(
        AccountsReceivable.company_id == current_user.company_id
    )
    
    # Aplicar filtros
    if search:
        search_filter = or_(
            AccountsReceivable.description.ilike(f"%{search}%"),
            AccountsReceivable.notes.ilike(f"%{search}%"),
            AccountsReceivable.reference.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(AccountsReceivable.status == status)
    
    if customer_id:
        query = query.filter(AccountsReceivable.customer_id == customer_id)
    
    if category_id:
        query = query.filter(AccountsReceivable.category_id == category_id)
    
    if receivable_type:
        query = query.filter(AccountsReceivable.receivable_type == receivable_type)
    
    if due_date_from:
        query = query.filter(AccountsReceivable.due_date >= due_date_from)
    
    if due_date_to:
        query = query.filter(AccountsReceivable.due_date <= due_date_to)
    
    # Ordenar por data de vencimento
    query = query.order_by(AccountsReceivable.due_date)
    
    # Paginação
    receivables = query.offset(skip).limit(limit).all()
    
    return receivables

@router.get("/{receivable_id}", response_model=AccountsReceivableResponse)
def get_accounts_receivable_detail(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de uma conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        and_(
            AccountsReceivable.id == receivable_id,
            AccountsReceivable.company_id == current_user.company_id
        )
    ).first()
    
    if not receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )
    
    return receivable

@router.put("/{receivable_id}", response_model=AccountsReceivableResponse)
def update_accounts_receivable(
    receivable_id: int,
    receivable_update: AccountsReceivableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar uma conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        and_(
            AccountsReceivable.id == receivable_id,
            AccountsReceivable.company_id == current_user.company_id
        )
    ).first()
    
    if not receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )
    
    # Verificar se o cliente existe (se for alterado)
    if receivable_update.customer_id:
        customer = db.query(Customer).filter(
            and_(
                Customer.id == receivable_update.customer_id,
                Customer.company_id == current_user.company_id
            )
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )
    
    # Verificar se a categoria existe (se for alterada)
    if receivable_update.category_id:
        category = db.query(Category).filter(
            and_(
                Category.id == receivable_update.category_id,
                Category.company_id == current_user.company_id
            )
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoria não encontrada"
            )
    
    # Atualizar campos
    update_data = receivable_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(receivable, field, value)
    
    # Atualizar status se necessário
    if receivable_update.paid_amount is not None:
        if receivable_update.paid_amount >= receivable.total_amount:
            receivable.status = ReceivableStatus.PAID
            receivable.payment_date = receivable_update.payment_date or date.today()
        elif receivable_update.paid_amount > 0:
            receivable.status = ReceivableStatus.PENDING
        elif receivable_update.paid_amount == 0:
            receivable.status = ReceivableStatus.PENDING
            receivable.payment_date = None
    
    # Se o status foi enviado explicitamente, usar ele
    if receivable_update.status is not None:
        receivable.status = receivable_update.status
    
    db.commit()
    db.refresh(receivable)
    
    return receivable

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_accounts_receivable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar todas as contas a receber da empresa"""
    # Buscar todas as contas a receber da empresa
    receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.company_id == current_user.company_id
    ).all()
    
    # Contar quantas serão deletadas
    count = len(receivables)
    
    if count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma conta a receber encontrada para deletar"
        )
    
    # Deletar todas as contas a receber
    for receivable in receivables:
        db.delete(receivable)
    
    db.commit()
    
    return {"message": f"{count} conta(s) a receber deletada(s) com sucesso"}

@router.delete("/{receivable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accounts_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar uma conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        and_(
            AccountsReceivable.id == receivable_id,
            AccountsReceivable.company_id == current_user.company_id
        )
    ).first()
    
    if not receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )
    
    # Verificar se pode ser deletada
    if receivable.status == ReceivableStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível deletar uma conta a receber já paga"
        )
    
    db.delete(receivable)
    db.commit()

@router.get("/reports/summary", response_model=AccountsReceivableSummary)
def get_accounts_receivable_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo das contas a receber"""
    # Consultas básicas
    total_receivable = db.query(func.sum(AccountsReceivable.total_amount)).filter(
        AccountsReceivable.company_id == current_user.company_id
    ).scalar() or 0
    
    total_paid = db.query(func.sum(AccountsReceivable.paid_amount)).filter(
        AccountsReceivable.company_id == current_user.company_id
    ).scalar() or 0
    
    # Contas vencidas
    overdue_query = db.query(func.sum(AccountsReceivable.total_amount - AccountsReceivable.paid_amount)).filter(
        and_(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == ReceivableStatus.PENDING,
            AccountsReceivable.due_date < date.today()
        )
    )
    total_overdue = overdue_query.scalar() or 0
    
    # Contas pendentes
    pending_query = db.query(func.sum(AccountsReceivable.total_amount - AccountsReceivable.paid_amount)).filter(
        and_(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == ReceivableStatus.PENDING,
            AccountsReceivable.due_date >= date.today()
        )
    )
    total_pending = pending_query.scalar() or 0
    
    # Contadores
    overdue_count = db.query(func.count(AccountsReceivable.id)).filter(
        and_(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == ReceivableStatus.PENDING,
            AccountsReceivable.due_date < date.today()
        )
    ).scalar() or 0
    
    pending_count = db.query(func.count(AccountsReceivable.id)).filter(
        and_(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == ReceivableStatus.PENDING,
            AccountsReceivable.due_date >= date.today()
        )
    ).scalar() or 0
    
    paid_count = db.query(func.count(AccountsReceivable.id)).filter(
        and_(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == ReceivableStatus.PAID
        )
    ).scalar() or 0
    
    # Por status
    by_status = {
        "pending": pending_count,
        "paid": paid_count,
        "overdue": overdue_count
    }
    
    # Por mês (últimos 12 meses)
    by_month = []
    for i in range(12):
        month_date = date.today() - timedelta(days=30*i)
        month_start = month_date.replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_total = db.query(func.sum(AccountsReceivable.total_amount)).filter(
            and_(
                AccountsReceivable.company_id == current_user.company_id,
                AccountsReceivable.entry_date >= month_start,
                AccountsReceivable.entry_date <= month_end
            )
        ).scalar() or 0
        
        by_month.append({
            "month": month_start.strftime("%Y-%m"),
            "total": float(month_total)
        })
    
    return AccountsReceivableSummary(
        total_receivable=float(total_receivable),
        total_paid=float(total_paid),
        total_overdue=float(total_overdue),
        total_pending=float(total_pending),
        overdue_count=overdue_count,
        pending_count=pending_count,
        paid_count=paid_count,
        by_status=by_status,
        by_month=by_month
    ) 