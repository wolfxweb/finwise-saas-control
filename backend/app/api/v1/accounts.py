from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal
from ...core.database import get_db
from ..v1.auth import get_current_user
from ...models.user import User
from ...models.account import Account
from ...models.bank import Bank
from ...schemas.account import AccountCreate, AccountUpdate, AccountResponse, AccountList, AccountSummary

router = APIRouter()

@router.get("/", response_model=List[AccountList])
def get_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    bank_id: Optional[int] = Query(None),
    account_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar contas da empresa"""
    query = db.query(Account, Bank.name.label('bank_name')).join(
        Bank, Account.bank_id == Bank.id
    ).filter(Account.company_id == current_user.company_id)
    
    if search:
        query = query.filter(
            Account.account_number.ilike(f"%{search}%") | 
            Account.holder_name.ilike(f"%{search}%") |
            Bank.name.ilike(f"%{search}%")
        )
    
    if bank_id:
        query = query.filter(Account.bank_id == bank_id)
    
    if account_type:
        query = query.filter(Account.account_type == account_type)
    
    if is_active is not None:
        query = query.filter(Account.is_active == is_active)
    
    results = query.offset(skip).limit(limit).all()
    
    # Converter para o formato esperado
    accounts = []
    for result in results:
        account_dict = {
            'id': result.Account.id,
            'bank_id': result.Account.bank_id,
            'bank_name': result.bank_name,
            'account_type': result.Account.account_type,
            'account_number': result.Account.account_number,
            'agency': result.Account.agency,
            'holder_name': result.Account.holder_name,
            'balance': result.Account.balance,
            'limit': result.Account.limit,
            'available_balance': result.Account.available_balance,
            'is_active': result.Account.is_active,
            'created_at': result.Account.created_at
        }
        accounts.append(account_dict)
    
    return accounts

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de uma conta"""
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.company_id == current_user.company_id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    
    return account

@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar nova conta"""
    # Verificar se o banco existe e pertence à empresa
    bank = db.query(Bank).filter(
        Bank.id == account.bank_id,
        Bank.company_id == current_user.company_id
    ).first()
    
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Banco não encontrado"
        )
    
    # Verificar se já existe uma conta com o mesmo número no mesmo banco
    existing_account = db.query(Account).filter(
        Account.account_number == account.account_number,
        Account.bank_id == account.bank_id,
        Account.company_id == current_user.company_id
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma conta com este número neste banco"
        )
    
    # Calcular saldo disponível
    available_balance = account.balance + account.limit
    
    db_account = Account(
        **account.dict(),
        company_id=current_user.company_id,
        available_balance=available_balance
    )
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_update: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar conta"""
    db_account = db.query(Account).filter(
        Account.id == account_id,
        Account.company_id == current_user.company_id
    ).first()
    
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    
    # Verificar se o banco está sendo alterado
    if account_update.bank_id and account_update.bank_id != db_account.bank_id:
        bank = db.query(Bank).filter(
            Bank.id == account_update.bank_id,
            Bank.company_id == current_user.company_id
        ).first()
        
        if not bank:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Banco não encontrado"
            )
    
    # Verificar se o número da conta está sendo alterado
    if account_update.account_number and account_update.account_number != db_account.account_number:
        existing_account = db.query(Account).filter(
            Account.account_number == account_update.account_number,
            Account.bank_id == account_update.bank_id or db_account.bank_id,
            Account.company_id == current_user.company_id,
            Account.id != account_id
        ).first()
        
        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma conta com este número neste banco"
            )
    
    # Atualizar apenas os campos fornecidos
    update_data = account_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    # Recalcular saldo disponível se balance ou limit foram alterados
    if 'balance' in update_data or 'limit' in update_data:
        balance = update_data.get('balance', db_account.balance)
        limit = update_data.get('limit', db_account.limit)
        db_account.available_balance = balance + limit
    
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Excluir conta"""
    db_account = db.query(Account).filter(
        Account.id == account_id,
        Account.company_id == current_user.company_id
    ).first()
    
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    
    db.delete(db_account)
    db.commit()
    
    return None

@router.get("/reports/summary", response_model=AccountSummary)
def get_accounts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo das contas"""
    # Total de contas
    total_accounts = db.query(func.count(Account.id)).filter(
        Account.company_id == current_user.company_id
    ).scalar()
    
    # Contas ativas e inativas
    active_accounts = db.query(func.count(Account.id)).filter(
        Account.company_id == current_user.company_id,
        Account.is_active == True
    ).scalar()
    
    inactive_accounts = total_accounts - active_accounts
    
    # Totais de saldos
    result = db.query(
        func.sum(Account.balance).label('total_balance'),
        func.sum(Account.limit).label('total_limit'),
        func.sum(Account.available_balance).label('total_available')
    ).filter(
        Account.company_id == current_user.company_id,
        Account.is_active == True
    ).first()
    
    return AccountSummary(
        total_accounts=total_accounts,
        total_balance=result.total_balance or Decimal('0'),
        total_limit=result.total_limit or Decimal('0'),
        total_available=result.total_available or Decimal('0'),
        active_accounts=active_accounts,
        inactive_accounts=inactive_accounts
    ) 