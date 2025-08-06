from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, case, cast, String, extract
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import UUID
import calendar

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.accounts_payable import AccountsPayable, PayableStatus, PayableType
from app.models.supplier import Supplier
from app.models.payable_category import PayableCategory
from app.models.user import User
from app.models.account import Account
from app.schemas.accounts_payable import (
    AccountsPayableCreate, AccountsPayableUpdate, AccountsPayableResponse, 
    AccountsPayableList, AccountsPayableSummary, InstallmentCreate, InstallmentResponse
)
from pydantic import BaseModel

router = APIRouter()

class PayableAnalysisMonth(BaseModel):
    month: str
    year: int
    total_amount: Decimal
    paid_amount: Decimal
    pending_amount: Decimal
    overdue_amount: Decimal
    count_total: int
    count_paid: int
    count_pending: int
    count_overdue: int

class PayableAnalysisCategory(BaseModel):
    category_id: Optional[int]
    category_name: str
    total_amount: Decimal
    percentage: float
    count: int

class PayableAnalysisSupplier(BaseModel):
    supplier_id: str
    supplier_name: str
    total_amount: Decimal
    percentage: float
    count: int

class PayableAnalysisForecast(BaseModel):
    date: date
    amount: Decimal
    description: str
    supplier_name: str
    category_name: Optional[str]
    is_fixed_cost: bool

class PayableAnalysisResponse(BaseModel):
    current_month: PayableAnalysisMonth
    next_months: List[PayableAnalysisMonth]
    categories: List[PayableAnalysisCategory]
    suppliers: List[PayableAnalysisSupplier]
    forecast: List[PayableAnalysisForecast]
    summary: dict

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
        
        # Verificar se a conta bancária existe (se fornecida)
        if payable.account_id:
            from app.models.account import Account
            account = db.query(Account).filter(
                Account.id == payable.account_id,
                Account.company_id == current_user.company_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conta bancária não encontrada"
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
            account_id=payable.account_id,
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
        
        # Verificar se a conta bancária existe (se fornecida)
        if installment_data.account_id:
            from app.models.account import Account
            account = db.query(Account).filter(
                Account.id == installment_data.account_id,
                Account.company_id == current_user.company_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conta bancária não encontrada"
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
                account_id=installment_data.account_id,
                description=f"{installment_data.description} - Parcela {i+1}/{installment_data.total_installments}",
                payable_type=PayableType.INSTALLMENT,
                total_amount=installment_amount,  # Valor da parcela individual
                entry_date=current_due_date,  # Data de entrada = data de vencimento (lançamento no mês correto)
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
            
            # Calcular próxima data de vencimento (próximo mês)
            # Vamos calcular mês a mês para garantir datas corretas
            if current_due_date.month == 12:
                next_month = 1
                next_year = current_due_date.year + 1
            else:
                next_month = current_due_date.month + 1
                next_year = current_due_date.year
            
            # Manter o mesmo dia, mas se não existir no próximo mês, usar o último dia
            try:
                current_due_date = current_due_date.replace(year=next_year, month=next_month)
            except ValueError:
                # Dia não existe no próximo mês (ex: 31 em fevereiro)
                # Usar o último dia do mês
                last_day = calendar.monthrange(next_year, next_month)[1]
                current_due_date = current_due_date.replace(year=next_year, month=next_month, day=last_day)
        
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
    
    # Paginação com relacionamentos
    payables = query.options(
        joinedload(AccountsPayable.account).joinedload(Account.bank)
    ).offset(skip).limit(limit).all()
    
    return payables

@router.get("/analysis", response_model=PayableAnalysisResponse)
def get_payables_analysis(
    months_ahead: int = Query(6, ge=1, le=12),
    category_filter: Optional[int] = None,
    supplier_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    cost_type_filter: Optional[str] = Query(None, description="fixed, variable, or both"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter análise detalhada de contas a pagar com dados para gráficos e previsão"""
    
    try:
        from dateutil.relativedelta import relativedelta
        
        today = date.today()
        current_month_start = today.replace(day=1)
        
        # Filtros base
        base_filters = [AccountsPayable.company_id == current_user.company_id]
        
        if category_filter:
            base_filters.append(AccountsPayable.category_id == category_filter)
        if supplier_filter:
            base_filters.append(AccountsPayable.supplier_id == supplier_filter)
        if status_filter:
            base_filters.append(AccountsPayable.status == status_filter)
        
        # Filtro por tipo de custo
        if cost_type_filter == "fixed":
            # Apenas custos fixos ('S', 'SIM', '1', etc.)
            base_filters.append(
                or_(
                    AccountsPayable.is_fixed_cost == 'S',
                    AccountsPayable.is_fixed_cost == 'SIM',
                    AccountsPayable.is_fixed_cost == '1',
                    AccountsPayable.is_fixed_cost == 'Y',
                    AccountsPayable.is_fixed_cost == 'YES'
                )
            )
        elif cost_type_filter == "variable":
            # Apenas custos variáveis ('N', 'NAO', '0', null, etc.)
            base_filters.append(
                or_(
                    AccountsPayable.is_fixed_cost == 'N',
                    AccountsPayable.is_fixed_cost == 'NAO',
                    AccountsPayable.is_fixed_cost == '0',
                    AccountsPayable.is_fixed_cost == '',
                    AccountsPayable.is_fixed_cost.is_(None)
                )
            )
        # Se cost_type_filter == "both" ou None, não aplica filtro (mostra todos)
        
        # 1. ANÁLISE DO MÊS ATUAL
        current_month_end = (current_month_start + relativedelta(months=1)) - timedelta(days=1)
        
        current_month_data = db.query(
            func.sum(AccountsPayable.total_amount).label('total_amount'),
            func.sum(case(
                (AccountsPayable.status == 'paid', AccountsPayable.paid_amount),
                else_=0
            )).label('paid_amount'),
            func.sum(case(
                (AccountsPayable.status == 'pending', AccountsPayable.total_amount - AccountsPayable.paid_amount),
                else_=0
            )).label('pending_amount'),
            func.sum(case(
                (and_(
                    AccountsPayable.status.in_(['pending', 'overdue']),
                    AccountsPayable.due_date < today
                ), AccountsPayable.total_amount - AccountsPayable.paid_amount),
                else_=0
            )).label('overdue_amount'),
            func.count(AccountsPayable.id).label('count_total'),
            func.sum(case(
                (AccountsPayable.status == 'paid', 1),
                else_=0
            )).label('count_paid'),
            func.sum(case(
                (AccountsPayable.status == 'pending', 1),
                else_=0
            )).label('count_pending'),
            func.sum(case(
                (and_(
                    AccountsPayable.status.in_(['pending', 'overdue']),
                    AccountsPayable.due_date < today
                ), 1),
                else_=0
            )).label('count_overdue')
        ).filter(
            and_(
                AccountsPayable.due_date >= current_month_start,
                AccountsPayable.due_date <= current_month_end,
                *base_filters
            )
        ).first()
        
        current_month = PayableAnalysisMonth(
            month=current_month_start.strftime("%B"),
            year=current_month_start.year,
            total_amount=current_month_data.total_amount or Decimal('0'),
            paid_amount=current_month_data.paid_amount or Decimal('0'),
            pending_amount=current_month_data.pending_amount or Decimal('0'),
            overdue_amount=current_month_data.overdue_amount or Decimal('0'),
            count_total=current_month_data.count_total or 0,
            count_paid=current_month_data.count_paid or 0,
            count_pending=current_month_data.count_pending or 0,
            count_overdue=current_month_data.count_overdue or 0
        )
        
        # 2. ANÁLISE DOS PRÓXIMOS MESES
        next_months = []
        for i in range(1, months_ahead + 1):
            month_start = current_month_start + relativedelta(months=i)
            month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)
            
            month_data = db.query(
                func.sum(AccountsPayable.total_amount).label('total_amount'),
                func.sum(case(
                    (AccountsPayable.status == 'paid', AccountsPayable.paid_amount),
                    else_=0
                )).label('paid_amount'),
                func.sum(case(
                    (AccountsPayable.status == 'pending', AccountsPayable.total_amount - AccountsPayable.paid_amount),
                    else_=0
                )).label('pending_amount'),
                func.count(AccountsPayable.id).label('count_total'),
                func.sum(case(
                    (AccountsPayable.status == 'paid', 1),
                    else_=0
                )).label('count_paid'),
                func.sum(case(
                    (AccountsPayable.status == 'pending', 1),
                    else_=0
                )).label('count_pending')
            ).filter(
                and_(
                    AccountsPayable.due_date >= month_start,
                    AccountsPayable.due_date <= month_end,
                    *base_filters
                )
            ).first()
            
            next_months.append(PayableAnalysisMonth(
                month=month_start.strftime("%B"),
                year=month_start.year,
                total_amount=month_data.total_amount or Decimal('0'),
                paid_amount=month_data.paid_amount or Decimal('0'),
                pending_amount=month_data.pending_amount or Decimal('0'),
                overdue_amount=Decimal('0'),  # Próximos meses não têm vencidas ainda
                count_total=month_data.count_total or 0,
                count_paid=month_data.count_paid or 0,
                count_pending=month_data.count_pending or 0,
                count_overdue=0
            ))
        
        # 3. ANÁLISE POR CATEGORIA
        end_analysis_date = current_month_start + relativedelta(months=months_ahead)
        
        categories_data = db.query(
            AccountsPayable.category_id,
            PayableCategory.name.label('category_name'),
            func.sum(AccountsPayable.total_amount).label('total_amount'),
            func.count(AccountsPayable.id).label('count')
        ).outerjoin(
            PayableCategory, AccountsPayable.category_id == PayableCategory.id
        ).filter(
            and_(
                AccountsPayable.due_date >= current_month_start,
                AccountsPayable.due_date < end_analysis_date,
                *base_filters
            )
        ).group_by(
            AccountsPayable.category_id, PayableCategory.name
        ).all()
        
        total_categories = sum(cat.total_amount or Decimal('0') for cat in categories_data)
        
        categories = []
        for cat in categories_data:
            amount = cat.total_amount or Decimal('0')
            percentage = float((amount / total_categories) * 100) if total_categories > 0 else 0
            categories.append(PayableAnalysisCategory(
                category_id=cat.category_id,
                category_name=cat.category_name or "Sem Categoria",
                total_amount=amount,
                percentage=round(percentage, 2),
                count=cat.count or 0
            ))
        
        # 4. ANÁLISE POR FORNECEDOR
        suppliers_data = db.query(
            AccountsPayable.supplier_id,
            Supplier.name.label('supplier_name'),
            func.sum(AccountsPayable.total_amount).label('total_amount'),
            func.count(AccountsPayable.id).label('count')
        ).join(
            Supplier, AccountsPayable.supplier_id == Supplier.id
        ).filter(
            and_(
                AccountsPayable.due_date >= current_month_start,
                AccountsPayable.due_date < end_analysis_date,
                *base_filters
            )
        ).group_by(
            AccountsPayable.supplier_id, Supplier.name
        ).all()
        
        total_suppliers = sum(sup.total_amount for sup in suppliers_data)
        suppliers = []
        for sup in suppliers_data:
            percentage = float((sup.total_amount / total_suppliers) * 100) if total_suppliers > 0 else 0
            suppliers.append(PayableAnalysisSupplier(
                supplier_id=str(sup.supplier_id),
                supplier_name=sup.supplier_name,
                total_amount=sup.total_amount,
                percentage=round(percentage, 2),
                count=sup.count
            ))
        
        # 5. PREVISÃO DE CAIXA (próximos 30 dias)
        forecast_end = today + timedelta(days=30)
        
        forecast_data = db.query(AccountsPayable).options(
            joinedload(AccountsPayable.supplier),
            joinedload(AccountsPayable.category)
        ).filter(
            and_(
                AccountsPayable.company_id == current_user.company_id,
                AccountsPayable.status.in_(['pending']),
                AccountsPayable.due_date >= today,
                AccountsPayable.due_date <= forecast_end
            )
        ).order_by(AccountsPayable.due_date).all()
        
        forecast = []
        for payable in forecast_data:
            # Converter is_fixed_cost para boolean de forma segura
            is_fixed_cost = False
            if payable.is_fixed_cost:
                if isinstance(payable.is_fixed_cost, str):
                    is_fixed_cost = payable.is_fixed_cost.upper() in ['S', 'SIM', 'TRUE', '1', 'Y', 'YES']
                elif isinstance(payable.is_fixed_cost, bool):
                    is_fixed_cost = payable.is_fixed_cost
                else:
                    is_fixed_cost = bool(payable.is_fixed_cost)
            
            forecast.append(PayableAnalysisForecast(
                date=payable.due_date,
                amount=payable.total_amount - payable.paid_amount,
                description=payable.description,
                supplier_name=payable.supplier.name if payable.supplier else "Fornecedor não informado",
                category_name=payable.category.name if payable.category else None,
                is_fixed_cost=is_fixed_cost
            ))
        
        # 6. RESUMO GERAL
        summary = {
            "total_analysis_period": current_month.total_amount + sum(m.total_amount for m in next_months),
            "total_pending_period": current_month.pending_amount + sum(m.pending_amount for m in next_months),
            "total_forecast_30_days": sum(f.amount for f in forecast),
            "fixed_costs_percentage": 0,  # Será calculado se necessário
            "top_category": max(categories, key=lambda x: x.total_amount).category_name if categories else None,
            "top_supplier": max(suppliers, key=lambda x: x.total_amount).supplier_name if suppliers else None
        }
        
        return PayableAnalysisResponse(
            current_month=current_month,
            next_months=next_months,
            categories=sorted(categories, key=lambda x: x.total_amount, reverse=True),
            suppliers=sorted(suppliers, key=lambda x: x.total_amount, reverse=True),
            forecast=forecast,
            summary=summary
        )
        
    except Exception as e:
        print(f"Erro na análise de contas a pagar: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar análise: {str(e)}"
        )

@router.get("/{payable_id}", response_model=AccountsPayableResponse)
def get_accounts_payable_detail(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de uma conta a pagar"""
    payable = db.query(AccountsPayable).options(
        joinedload(AccountsPayable.account).joinedload(Account.bank)
    ).filter(
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
 