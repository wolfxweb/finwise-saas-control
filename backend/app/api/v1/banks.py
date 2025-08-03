from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ..v1.auth import get_current_user
from ...models.user import User
from ...models.bank import Bank
from ...schemas.bank import BankCreate, BankUpdate, BankResponse, BankList

router = APIRouter()

@router.get("/", response_model=List[BankList])
def get_banks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar bancos da empresa"""
    query = db.query(Bank).filter(Bank.company_id == current_user.company_id)
    
    if search:
        query = query.filter(
            Bank.name.ilike(f"%{search}%") | 
            Bank.code.ilike(f"%{search}%")
        )
    
    if is_active is not None:
        query = query.filter(Bank.is_active == is_active)
    
    banks = query.offset(skip).limit(limit).all()
    return banks

@router.get("/{bank_id}", response_model=BankResponse)
def get_bank(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de um banco"""
    bank = db.query(Bank).filter(
        Bank.id == bank_id,
        Bank.company_id == current_user.company_id
    ).first()
    
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco não encontrado"
        )
    
    return bank

@router.post("/", response_model=BankResponse, status_code=status.HTTP_201_CREATED)
def create_bank(
    bank: BankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar novo banco"""
    # Verificar se já existe um banco com o mesmo código
    existing_bank = db.query(Bank).filter(
        Bank.code == bank.code,
        Bank.company_id == current_user.company_id
    ).first()
    
    if existing_bank:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um banco com este código"
        )
    
    db_bank = Bank(
        **bank.dict(),
        company_id=current_user.company_id
    )
    
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    
    return db_bank

@router.put("/{bank_id}", response_model=BankResponse)
def update_bank(
    bank_id: int,
    bank_update: BankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar banco"""
    db_bank = db.query(Bank).filter(
        Bank.id == bank_id,
        Bank.company_id == current_user.company_id
    ).first()
    
    if not db_bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco não encontrado"
        )
    
    # Verificar se o código está sendo alterado e se já existe
    if bank_update.code and bank_update.code != db_bank.code:
        existing_bank = db.query(Bank).filter(
            Bank.code == bank_update.code,
            Bank.company_id == current_user.company_id,
            Bank.id != bank_id
        ).first()
        
        if existing_bank:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um banco com este código"
            )
    
    # Atualizar apenas os campos fornecidos
    update_data = bank_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_bank, field, value)
    
    db.commit()
    db.refresh(db_bank)
    
    return db_bank

@router.delete("/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Excluir banco"""
    db_bank = db.query(Bank).filter(
        Bank.id == bank_id,
        Bank.company_id == current_user.company_id
    ).first()
    
    if not db_bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco não encontrado"
        )
    
    # Verificar se há contas associadas
    if db_bank.accounts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir um banco que possui contas associadas"
        )
    
    db.delete(db_bank)
    db.commit()
    
    return None 