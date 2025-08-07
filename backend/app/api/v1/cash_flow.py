from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, case, cast, String
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.accounts_receivable import AccountsReceivable, ReceivableStatus
from app.models.accounts_payable import AccountsPayable, PayableStatus, PayableType
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.category import Category
from app.models.payable_category import PayableCategory
from app.models.account import Account
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class CashFlowMovement(BaseModel):
    id: str
    date: date
    description: str
    amount: Decimal
    type: str  # "entrada" ou "saida"
    category: Optional[str] = None
    account: Optional[str] = None
    status: str
    status_display: str  # Status em português
    source: str  # "receivable" ou "payable"
    source_id: int
    due_date: Optional[date] = None
    paid_amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None
    customer_supplier: Optional[str] = None  # Nome do cliente ou fornecedor

class CashFlowMovementsPaginated(BaseModel):
    movements: List[CashFlowMovement]
    total: int
    page: int
    limit: int
    total_pages: int

class CashFlowSummary(BaseModel):
    total_entries: Decimal
    total_exits: Decimal
    current_balance: Decimal
    pending_receivables: Decimal
    pending_payables: Decimal
    overdue_receivables: Decimal
    overdue_payables: Decimal

class CashFlowForecast(BaseModel):
    date: date
    expected_balance: Decimal
    receivables: Decimal
    payables: Decimal

class CategorySummary(BaseModel):
    category_id: Optional[int]
    category_name: str
    total_amount: Decimal
    percentage: float
    count: int

class MonthlyData(BaseModel):
    month: str
    entries: Decimal
    exits: Decimal

class CategoriesSummary(BaseModel):
    entries: List[CategorySummary]
    exits: List[CategorySummary]
    total_entries: Decimal
    total_exits: Decimal
    monthly_data: List[MonthlyData]
    chart_data: dict  # Dados formatados para gráficos

class FilterOptions(BaseModel):
    customers: List[dict]
    suppliers: List[dict]
    categories_receivable: List[dict]
    categories_payable: List[dict]
    accounts: List[dict]

class DREItem(BaseModel):
    description: str
    value: Decimal
    percentage: Optional[float] = None
    level: int  # 1 = título principal, 2 = subtítulo, 3 = item

class DRESection(BaseModel):
    title: str
    items: List[DREItem]
    total: Decimal
    level: int

class DREResponse(BaseModel):
    period: str
    sections: List[DRESection]
    revenue_total: Decimal
    cost_total: Decimal
    gross_profit: Decimal
    operational_expenses_total: Decimal
    operational_result: Decimal
    financial_result: Decimal
    result_before_taxes: Decimal
    taxes: Decimal
    net_result: Decimal

def translate_status(status_value, source_type="receivable"):
    """Traduzir status para português"""
    status_translations = {
        "receivable": {
            "PENDING": "Pendente",
            "PAID": "Pago", 
            "OVERDUE": "Vencido",
            "PARTIALLY_PAID": "Parcialmente Pago",
            "CANCELLED": "Cancelado"
        },
        "payable": {
            "PENDING": "Pendente", 
            "PAID": "Pago",
            "OVERDUE": "Vencido",
            "PARTIALLY_PAID": "Parcialmente Pago",
            "CANCELLED": "Cancelado"
        }
    }
    
    # Extrair o valor do enum se necessário
    status_str = ""
    if hasattr(status_value, 'value'):
        status_str = status_value.value.upper()
    elif hasattr(status_value, 'name'):
        status_str = status_value.name.upper()
    else:
        status_str = str(status_value).upper()
    
    # Limpar possíveis prefixos de enum
    if '.' in status_str:
        status_str = status_str.split('.')[-1]
    
    # Retornar tradução ou valor original se não encontrado
    translated = status_translations.get(source_type, {}).get(status_str, status_str)
    print(f"Status translation - Input: {status_value}, Extracted: {status_str}, Type: {source_type}, Output: {translated}")
    return translated

@router.get("/movements", response_model=CashFlowMovementsPaginated)
def get_cash_flow_movements(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    movement_type: Optional[str] = None,  # "entrada", "saida", or None for all
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    customer_supplier_id: Optional[str] = None,  # ID do cliente ou fornecedor
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter movimentações do fluxo de caixa baseadas em contas a receber e pagar com paginação"""
    
    try:
        movements = []
        
        # Buscar contas a receber (entradas)
        receivables_query = db.query(AccountsReceivable).options(
            joinedload(AccountsReceivable.customer),
            joinedload(AccountsReceivable.category),
            joinedload(AccountsReceivable.account).joinedload(Account.bank)
        ).filter(
            AccountsReceivable.company_id == current_user.company_id
        )
        
        # Aplicar filtros para receivables
        if start_date:
            receivables_query = receivables_query.filter(AccountsReceivable.due_date >= start_date)
        if end_date:
            receivables_query = receivables_query.filter(AccountsReceivable.due_date <= end_date)
        if status_filter:
            receivables_query = receivables_query.filter(AccountsReceivable.status == status_filter)
        if customer_supplier_id:
            receivables_query = receivables_query.filter(AccountsReceivable.customer_id == customer_supplier_id)
        if category_id:
            receivables_query = receivables_query.filter(AccountsReceivable.category_id == category_id)
        if account_id:
            receivables_query = receivables_query.filter(AccountsReceivable.account_id == account_id)
        if search:
            receivables_query = receivables_query.filter(
                or_(
                    AccountsReceivable.description.ilike(f"%{search}%"),
                    AccountsReceivable.reference.ilike(f"%{search}%"),
                    AccountsReceivable.notes.ilike(f"%{search}%")
                )
            )
        
        # Buscar contas a pagar (saídas)
        payables_query = db.query(AccountsPayable).options(
            joinedload(AccountsPayable.supplier),
            joinedload(AccountsPayable.category),
            joinedload(AccountsPayable.account).joinedload(Account.bank)
        ).filter(
            AccountsPayable.company_id == current_user.company_id
        )
        
        # Aplicar filtros para payables
        if start_date:
            payables_query = payables_query.filter(AccountsPayable.due_date >= start_date)
        if end_date:
            payables_query = payables_query.filter(AccountsPayable.due_date <= end_date)
        if status_filter:
            payables_query = payables_query.filter(AccountsPayable.status == status_filter)
        if customer_supplier_id:
            payables_query = payables_query.filter(AccountsPayable.supplier_id == customer_supplier_id)
        if category_id:
            payables_query = payables_query.filter(AccountsPayable.category_id == category_id)
        if account_id:
            payables_query = payables_query.filter(AccountsPayable.account_id == account_id)
        if search:
            payables_query = payables_query.filter(
                or_(
                    AccountsPayable.description.ilike(f"%{search}%"),
                    AccountsPayable.reference.ilike(f"%{search}%"),
                    AccountsPayable.notes.ilike(f"%{search}%")
                )
            )
        
        # Processar contas a receber
        if movement_type != "saida":
            receivables = receivables_query.all()
            for receivable in receivables:
                account_name = None
                if receivable.account and receivable.account.bank:
                    account_name = f"{receivable.account.bank.name} - {receivable.account.account_number}"
                
                movements.append(CashFlowMovement(
                    id=f"R{receivable.id}",
                    date=receivable.entry_date,
                    description=receivable.description,
                    amount=receivable.total_amount,
                    type="entrada",
                    category=receivable.category.name if receivable.category else None,
                    account=account_name,
                    status=receivable.status.value if hasattr(receivable.status, 'value') else str(receivable.status),
                    status_display=translate_status(receivable.status, "receivable"),
                    source="receivable",
                    source_id=receivable.id,
                    due_date=receivable.due_date,
                    paid_amount=receivable.paid_amount,
                    payment_date=receivable.payment_date,
                    notes=receivable.notes,
                    customer_supplier=receivable.customer.name if receivable.customer else None
                ))
        
        # Processar contas a pagar
        if movement_type != "entrada":
            payables = payables_query.all()
            for payable in payables:
                account_name = None
                if payable.account and payable.account.bank:
                    account_name = f"{payable.account.bank.name} - {payable.account.account_number}"
                
                movements.append(CashFlowMovement(
                    id=f"P{payable.id}",
                    date=payable.entry_date,
                    description=payable.description,
                    amount=payable.total_amount,
                    type="saida",
                    category=payable.category.name if payable.category else None,
                    account=account_name,
                    status=payable.status.value if hasattr(payable.status, 'value') else str(payable.status),
                    status_display=translate_status(payable.status, "payable"),
                    source="payable",
                    source_id=payable.id,
                    due_date=payable.due_date,
                    paid_amount=payable.paid_amount,
                    payment_date=payable.payment_date,
                    notes=payable.notes,
                    customer_supplier=payable.supplier.name if payable.supplier else None
                ))
        
        # Ordenar por data (mais recentes primeiro)
        movements.sort(key=lambda x: x.date, reverse=True)
        
        # Aplicar paginação
        total = len(movements)
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_movements = movements[start_index:end_index]
        
        total_pages = (total + limit - 1) // limit  # Ceiling division
        
        return CashFlowMovementsPaginated(
            movements=paginated_movements,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        print(f"Erro na API cash flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar movimentações: {str(e)}"
        )

@router.get("/summary", response_model=CashFlowSummary)
def get_cash_flow_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: Optional[str] = Query("current_month"),  # "current_month", "all"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo do fluxo de caixa"""
    
    try:
        # Definir período padrão se não especificado
        if not start_date or not end_date:
            today = date.today()
            if period == "current_month":
                start_date = today.replace(day=1)
                # Último dia do mês atual
                if today.month == 12:
                    end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            elif period == "all":
                # Sem filtro de data para compatibilidade
                start_date = None
                end_date = None
        
        # Query base para contas a receber
        receivables_query = db.query(
            func.sum(AccountsReceivable.total_amount).label('total'),
            func.sum(case(
                (AccountsReceivable.status == ReceivableStatus.PENDING, AccountsReceivable.total_amount),
                else_=0
            )).label('pending'),
            func.sum(case(
                (and_(
                    AccountsReceivable.status == ReceivableStatus.PENDING,
                    AccountsReceivable.due_date < date.today()
                ), AccountsReceivable.total_amount),
                else_=0
            )).label('overdue')
        ).filter(
            AccountsReceivable.company_id == current_user.company_id
        )
        
        # Aplicar filtro de data para receivables se especificado
        if start_date and end_date:
            receivables_query = receivables_query.filter(
                and_(
                    AccountsReceivable.due_date >= start_date,
                    AccountsReceivable.due_date <= end_date
                )
            )
        
        receivables_summary = receivables_query.first()
        
        # Query base para contas a pagar
        payables_query = db.query(
            func.sum(AccountsPayable.total_amount).label('total'),
            func.sum(case(
                (AccountsPayable.status == PayableStatus.PENDING, AccountsPayable.total_amount),
                else_=0
            )).label('pending'),
            func.sum(case(
                (and_(
                    AccountsPayable.status == PayableStatus.PENDING,
                    AccountsPayable.due_date < date.today()
                ), AccountsPayable.total_amount),
                else_=0
            )).label('overdue')
        ).filter(
            AccountsPayable.company_id == current_user.company_id
        )
        
        # Aplicar filtro de data para payables se especificado
        if start_date and end_date:
            payables_query = payables_query.filter(
                and_(
                    AccountsPayable.due_date >= start_date,
                    AccountsPayable.due_date <= end_date
                )
            )
        
        payables_summary = payables_query.first()
        
        total_entries = receivables_summary.total or Decimal('0')
        total_exits = payables_summary.total or Decimal('0')
        current_balance = total_entries - total_exits
        
        return CashFlowSummary(
            total_entries=total_entries,
            total_exits=total_exits,
            current_balance=current_balance,
            pending_receivables=receivables_summary.pending or Decimal('0'),
            pending_payables=payables_summary.pending or Decimal('0'),
            overdue_receivables=receivables_summary.overdue or Decimal('0'),
            overdue_payables=payables_summary.overdue or Decimal('0')
        )
        
    except Exception as e:
        print(f"Erro na API cash flow summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar resumo: {str(e)}"
        )

@router.get("/forecast", response_model=List[CashFlowForecast])
def get_cash_flow_forecast(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter previsão de fluxo de caixa"""
    
    try:
        today = date.today()
        forecast_dates = [today + timedelta(days=i) for i in range(1, days_ahead + 1)]
        
        forecast = []
        current_balance = Decimal('0')
        
        for forecast_date in forecast_dates:
            # Contas a receber que vencem nesta data
            receivables = db.query(
                func.sum(AccountsReceivable.total_amount)
            ).filter(
                and_(
                    AccountsReceivable.company_id == current_user.company_id,
                    AccountsReceivable.status == ReceivableStatus.PENDING,
                    AccountsReceivable.due_date == forecast_date
                )
            ).scalar() or Decimal('0')
            
            # Contas a pagar que vencem nesta data
            payables = db.query(
                func.sum(AccountsPayable.total_amount)
            ).filter(
                and_(
                    AccountsPayable.company_id == current_user.company_id,
                    AccountsPayable.status == PayableStatus.PENDING,
                    AccountsPayable.due_date == forecast_date
                )
            ).scalar() or Decimal('0')
            
            # Atualizar saldo previsto
            current_balance += receivables - payables
            
            forecast.append(CashFlowForecast(
                date=forecast_date,
                expected_balance=current_balance,
                receivables=receivables,
                payables=payables
            ))
        
        return forecast
        
    except Exception as e:
        print(f"Erro na API cash flow forecast: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar previsão: {str(e)}"
        ) 

@router.get("/categories-summary", response_model=CategoriesSummary)
def get_categories_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_filter: Optional[str] = None,  # "entrada", "saida" ou None para todas
    period: Optional[str] = None,  # "current_month", "3_months", "6_months", "12_months", "year"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo por categorias com percentuais e dados para gráficos"""
    
    try:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        import calendar
        
        # Calcular período se especificado
        if period and not start_date and not end_date:
            today = date.today()
            if period == "current_month":
                start_date = today.replace(day=1)
                end_date = today
            elif period == "3_months":
                start_date = (today.replace(day=1) - relativedelta(months=2))
                end_date = today
            elif period == "6_months":
                start_date = (today.replace(day=1) - relativedelta(months=5))
                end_date = today
            elif period == "12_months":
                start_date = (today.replace(day=1) - relativedelta(months=11))
                end_date = today
            elif period == "year":
                start_date = today.replace(month=1, day=1)
                end_date = today
        
        # Filtros de data
        date_filter_receivables = []
        date_filter_payables = []
        
        if start_date:
            date_filter_receivables.append(AccountsReceivable.due_date >= start_date)
            date_filter_payables.append(AccountsPayable.due_date >= start_date)
        if end_date:
            date_filter_receivables.append(AccountsReceivable.due_date <= end_date)
            date_filter_payables.append(AccountsPayable.due_date <= end_date)
        
        # Buscar dados mensais para gráfico de linha
        monthly_data = []
        if start_date and end_date:
            current_month = start_date.replace(day=1)
            while current_month <= end_date:
                month_start = current_month
                if current_month.month == 12:
                    month_end = current_month.replace(year=current_month.year + 1, month=1, day=1) - relativedelta(days=1)
                else:
                    month_end = current_month.replace(month=current_month.month + 1, day=1) - relativedelta(days=1)
                
                # Total de entradas do mês (por data de vencimento)
                month_entries = db.query(
                    func.sum(AccountsReceivable.total_amount)
                ).filter(
                    AccountsReceivable.company_id == current_user.company_id,
                    AccountsReceivable.due_date >= month_start,
                    AccountsReceivable.due_date <= month_end
                ).scalar() or Decimal('0')
                
                # Total de saídas do mês (por data de vencimento)
                month_exits = db.query(
                    func.sum(AccountsPayable.total_amount)
                ).filter(
                    AccountsPayable.company_id == current_user.company_id,
                    AccountsPayable.due_date >= month_start,
                    AccountsPayable.due_date <= month_end
                ).scalar() or Decimal('0')
                
                monthly_data.append(MonthlyData(
                    month=current_month.strftime("%m/%Y"),
                    entries=month_entries,
                    exits=month_exits
                ))
                
                # Próximo mês
                if current_month.month == 12:
                    current_month = current_month.replace(year=current_month.year + 1, month=1)
                else:
                    current_month = current_month.replace(month=current_month.month + 1)
        
        # Buscar totais de entradas por categoria
        try:
            entries_query = db.query(
                AccountsReceivable.category_id,
                Category.name.label('category_name'),
                func.sum(AccountsReceivable.total_amount).label('total_amount'),
                func.count(AccountsReceivable.id).label('count')
            ).join(
                Category, AccountsReceivable.category_id == Category.id, isouter=True
            ).filter(
                AccountsReceivable.company_id == current_user.company_id,
                *date_filter_receivables
            ).group_by(
                AccountsReceivable.category_id, Category.name
            ).all()
        except Exception as e:
            print(f"Erro ao buscar entradas por categoria: {str(e)}")
            entries_query = []
        
        # Buscar totais de saídas por categoria
        try:
            exits_query = db.query(
                AccountsPayable.category_id,
                PayableCategory.name.label('category_name'),
                func.sum(AccountsPayable.total_amount).label('total_amount'),
                func.count(AccountsPayable.id).label('count')
            ).join(
                PayableCategory, AccountsPayable.category_id == PayableCategory.id, isouter=True
            ).filter(
                AccountsPayable.company_id == current_user.company_id,
                *date_filter_payables
            ).group_by(
                AccountsPayable.category_id, PayableCategory.name
            ).all()
        except Exception as e:
            print(f"Erro ao buscar saídas por categoria: {str(e)}")
            exits_query = []
        
        # Calcular totais gerais
        total_entries = sum(entry.total_amount or Decimal('0') for entry in entries_query)
        total_exits = sum(exit.total_amount or Decimal('0') for exit in exits_query)
        
        # Montar lista de entradas com percentuais
        entries_summary = []
        for entry in entries_query:
            percentage = float((entry.total_amount / total_entries) * 100) if total_entries > 0 else 0
            entries_summary.append(CategorySummary(
                category_id=entry.category_id,
                category_name=entry.category_name or "Sem Categoria",
                total_amount=entry.total_amount or Decimal('0'),
                percentage=round(percentage, 2),
                count=entry.count
            ))
        
        # Montar lista de saídas com percentuais
        exits_summary = []
        for exit in exits_query:
            percentage = float((exit.total_amount / total_exits) * 100) if total_exits > 0 else 0
            exits_summary.append(CategorySummary(
                category_id=exit.category_id,
                category_name=exit.category_name or "Sem Categoria",
                total_amount=exit.total_amount or Decimal('0'),
                percentage=round(percentage, 2),
                count=exit.count
            ))
        
        # Filtrar por categoria se especificado
        filtered_entries = entries_summary
        filtered_exits = exits_summary
        
        if category_filter == "entrada":
            filtered_exits = []
        elif category_filter == "saida":
            filtered_entries = []
        
        # Ordenar por valor (maior primeiro)
        filtered_entries.sort(key=lambda x: x.total_amount, reverse=True)
        filtered_exits.sort(key=lambda x: x.total_amount, reverse=True)
        
        # Preparar dados para gráficos
        chart_data = {
            "pie_entries": [
                {"name": cat.category_name, "value": float(cat.total_amount)}
                for cat in filtered_entries[:10]  # Top 10 categorias
            ],
            "pie_exits": [
                {"name": cat.category_name, "value": float(cat.total_amount)}
                for cat in filtered_exits[:10]  # Top 10 categorias
            ],
            "line_data": [
                {
                    "month": month.month,
                    "entradas": float(month.entries),
                    "saidas": float(month.exits)
                }
                for month in monthly_data
            ]
        }
        
        return CategoriesSummary(
            entries=filtered_entries,
            exits=filtered_exits,
            total_entries=total_entries,
            total_exits=total_exits,
            monthly_data=monthly_data,
            chart_data=chart_data
        )
        
    except Exception as e:
        print(f"Erro na API categories summary: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar resumo por categorias: {str(e)}"
        ) 

@router.get("/filter-options", response_model=FilterOptions)
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter opções para filtros"""
    
    try:
        # Buscar clientes
        customers = db.query(Customer).filter(
            Customer.company_id == current_user.company_id,
            Customer.is_active == True
        ).all()
        
        # Buscar fornecedores
        suppliers = db.query(Supplier).filter(
            Supplier.company_id == current_user.company_id,
            Supplier.is_active == True
        ).all()
        
        # Buscar categorias de contas a receber
        categories_receivable = db.query(Category).filter(
            Category.company_id == current_user.company_id,
            Category.is_active == True
        ).all()
        
        # Buscar categorias de contas a pagar
        categories_payable = db.query(PayableCategory).filter(
            PayableCategory.company_id == current_user.company_id,
            PayableCategory.is_active == True
        ).all()
        
        # Buscar contas bancárias
        accounts = db.query(Account).options(
            joinedload(Account.bank)
        ).filter(
            Account.company_id == current_user.company_id,
            Account.is_active == True
        ).all()
        
        return FilterOptions(
            customers=[{"id": str(c.id), "name": c.name} for c in customers],
            suppliers=[{"id": str(s.id), "name": s.name} for s in suppliers],
            categories_receivable=[{"id": c.id, "name": c.name} for c in categories_receivable],
            categories_payable=[{"id": c.id, "name": c.name} for c in categories_payable],
            accounts=[{
                "id": a.id, 
                "name": (
                    f"💳 {a.bank.name if a.bank else 'Banco'} - Final {a.account_number[-4:]} ({a.holder_name})" 
                    if a.account_type in ['credit', 'debit'] and a.account_number and len(a.account_number) >= 4
                    else f"{a.bank.name if a.bank else 'Banco'} - {a.account_number} ({a.holder_name})" 
                    if a.account_number 
                    else a.bank.name if a.bank else "Conta"
                )
            } for a in accounts]
        )
        
    except Exception as e:
        print(f"Erro na API filter options: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar opções de filtro: {str(e)}"
        ) 

@router.get("/dre", response_model=DREResponse)
def get_dre(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: Optional[str] = None,  # "current_month", "3_months", "6_months", "12_months", "year"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gerar DRE (Demonstração do Resultado do Exercício)"""
    
    try:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        # Calcular período se especificado
        if period and not start_date and not end_date:
            today = date.today()
            if period == "current_month":
                start_date = today.replace(day=1)
                end_date = today
            elif period == "3_months":
                start_date = (today.replace(day=1) - relativedelta(months=2))
                end_date = today
            elif period == "6_months":
                start_date = (today.replace(day=1) - relativedelta(months=5))
                end_date = today
            elif period == "12_months":
                start_date = (today.replace(day=1) - relativedelta(months=11))
                end_date = today
            elif period == "year":
                start_date = today.replace(month=1, day=1)
                end_date = today
        
        # Se não especificado, usar mês atual
        if not start_date or not end_date:
            today = date.today()
            start_date = today.replace(day=1)
            end_date = today
        
        # 1. RECEITAS (Contas a Receber PAGAS)
        receitas_query = db.query(
            Category.name.label('category_name'),
            func.sum(AccountsReceivable.total_amount).label('total_amount')
        ).join(
            Category, AccountsReceivable.category_id == Category.id, isouter=True
        ).filter(
            AccountsReceivable.company_id == current_user.company_id,
            AccountsReceivable.status == 'PAID',
            AccountsReceivable.due_date >= start_date,
            AccountsReceivable.due_date <= end_date
        ).group_by(Category.name).all()
        
        # 2. CUSTOS DOS PRODUTOS VENDIDOS (Categorias específicas de custo)
        custos_categorias = ['Custo dos Produtos', 'Matéria Prima', 'Mão de Obra Direta', 'Custos de Produção']
        custos_query = db.query(
            PayableCategory.name.label('category_name'),
            func.sum(AccountsPayable.total_amount).label('total_amount')
        ).join(
            PayableCategory, AccountsPayable.category_id == PayableCategory.id, isouter=True
        ).filter(
            AccountsPayable.company_id == current_user.company_id,
            AccountsPayable.status == 'PAID',
            AccountsPayable.due_date >= start_date,
            AccountsPayable.due_date <= end_date,
            PayableCategory.name.in_(custos_categorias)
        ).group_by(PayableCategory.name).all()
        
        # 3. DESPESAS OPERACIONAIS (Outras categorias de despesas)
        despesas_query = db.query(
            PayableCategory.name.label('category_name'),
            func.sum(AccountsPayable.total_amount).label('total_amount')
        ).join(
            PayableCategory, AccountsPayable.category_id == PayableCategory.id, isouter=True
        ).filter(
            AccountsPayable.company_id == current_user.company_id,
            AccountsPayable.status == 'PAID',
            AccountsPayable.due_date >= start_date,
            AccountsPayable.due_date <= end_date,
            or_(
                PayableCategory.name.notin_(custos_categorias),
                PayableCategory.name.is_(None)
            )
        ).group_by(PayableCategory.name).all()
        
        # Calcular totais
        revenue_total = sum(item.total_amount or Decimal('0') for item in receitas_query)
        cost_total = sum(item.total_amount or Decimal('0') for item in custos_query)
        operational_expenses_total = sum(item.total_amount or Decimal('0') for item in despesas_query)
        
        gross_profit = revenue_total - cost_total
        operational_result = gross_profit - operational_expenses_total
        
        # Para simplificar, vamos considerar resultado financeiro como 0 por enquanto
        financial_result = Decimal('0')
        result_before_taxes = operational_result + financial_result
        
        # Estimar impostos como 10% do resultado (simplificado)
        taxes = result_before_taxes * Decimal('0.1') if result_before_taxes > 0 else Decimal('0')
        net_result = result_before_taxes - taxes
        
        # Montar seções do DRE
        sections = []
        
        # 1. RECEITA BRUTA
        receita_items = []
        for receita in receitas_query:
            percentage = float((receita.total_amount / revenue_total) * 100) if revenue_total > 0 else 0
            receita_items.append(DREItem(
                description=receita.category_name or "Receitas Diversas",
                value=receita.total_amount,
                percentage=round(percentage, 2),
                level=3
            ))
        
        sections.append(DRESection(
            title="RECEITA BRUTA",
            items=receita_items,
            total=revenue_total,
            level=1
        ))
        
        # 2. CUSTO DOS PRODUTOS VENDIDOS
        custo_items = []
        for custo in custos_query:
            percentage = float((custo.total_amount / revenue_total) * 100) if revenue_total > 0 else 0
            custo_items.append(DREItem(
                description=custo.category_name or "Custos Diversos",
                value=custo.total_amount,
                percentage=round(percentage, 2),
                level=3
            ))
        
        sections.append(DRESection(
            title="(-) CUSTO DOS PRODUTOS VENDIDOS",
            items=custo_items,
            total=cost_total,
            level=1
        ))
        
        # 3. LUCRO BRUTO
        sections.append(DRESection(
            title="LUCRO BRUTO",
            items=[DREItem(
                description="Receita Bruta - Custo dos Produtos",
                value=gross_profit,
                percentage=float((gross_profit / revenue_total) * 100) if revenue_total > 0 else 0,
                level=2
            )],
            total=gross_profit,
            level=1
        ))
        
        # 4. DESPESAS OPERACIONAIS
        despesa_items = []
        for despesa in despesas_query:
            percentage = float((despesa.total_amount / revenue_total) * 100) if revenue_total > 0 else 0
            despesa_items.append(DREItem(
                description=despesa.category_name or "Despesas Diversas",
                value=despesa.total_amount,
                percentage=round(percentage, 2),
                level=3
            ))
        
        sections.append(DRESection(
            title="(-) DESPESAS OPERACIONAIS",
            items=despesa_items,
            total=operational_expenses_total,
            level=1
        ))
        
        # 5. RESULTADO OPERACIONAL
        sections.append(DRESection(
            title="RESULTADO OPERACIONAL",
            items=[DREItem(
                description="Lucro Bruto - Despesas Operacionais",
                value=operational_result,
                percentage=float((operational_result / revenue_total) * 100) if revenue_total > 0 else 0,
                level=2
            )],
            total=operational_result,
            level=1
        ))
        
        # 6. RESULTADO LÍQUIDO
        sections.append(DRESection(
            title="RESULTADO LÍQUIDO",
            items=[
                DREItem(
                    description="Resultado antes dos Impostos",
                    value=result_before_taxes,
                    percentage=float((result_before_taxes / revenue_total) * 100) if revenue_total > 0 else 0,
                    level=3
                ),
                DREItem(
                    description="(-) Impostos Estimados",
                    value=taxes,
                    percentage=float((taxes / revenue_total) * 100) if revenue_total > 0 else 0,
                    level=3
                ),
                DREItem(
                    description="Resultado Líquido Final",
                    value=net_result,
                    percentage=float((net_result / revenue_total) * 100) if revenue_total > 0 else 0,
                    level=2
                )
            ],
            total=net_result,
            level=1
        ))
        
        period_str = f"{start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}"
        
        return DREResponse(
            period=period_str,
            sections=sections,
            revenue_total=revenue_total,
            cost_total=cost_total,
            gross_profit=gross_profit,
            operational_expenses_total=operational_expenses_total,
            operational_result=operational_result,
            financial_result=financial_result,
            result_before_taxes=result_before_taxes,
            taxes=taxes,
            net_result=net_result
        )
        
    except Exception as e:
        print(f"Erro na API DRE: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar DRE: {str(e)}"
        ) 

 