from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.user import User
from app.models.payable_category import PayableCategory
from app.models.accounts_payable import AccountsPayable
from app.schemas.payable_category import (
    PayableCategoryCreate,
    PayableCategoryUpdate,
    PayableCategoryResponse,
    PayableCategoryList,
    PayableCategoryTree
)

router = APIRouter()


@router.get("/", response_model=List[PayableCategoryList])
def get_payable_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None
):
    """Listar categorias de contas a pagar"""
    query = db.query(PayableCategory).filter(PayableCategory.company_id == current_user.company_id)
    
    if search:
        query = query.filter(
            (PayableCategory.name.ilike(f"%{search}%")) |
            (PayableCategory.code.ilike(f"%{search}%")) |
            (PayableCategory.description.ilike(f"%{search}%"))
        )
    
    if parent_id is not None:
        query = query.filter(PayableCategory.parent_id == parent_id)
    
    if is_active is not None:
        query = query.filter(PayableCategory.is_active == is_active)
    
    # Adicionar contadores
    query = query.add_columns(
        func.count(AccountsPayable.id).label('payables_count'),
        func.count(PayableCategory.id).label('children_count')
    ).outerjoin(AccountsPayable).group_by(PayableCategory.id)
    
    categories = query.offset(skip).limit(limit).all()
    
    result = []
    for category, payables_count, children_count in categories:
        category_dict = {
            "id": category.id,
            "name": category.name,
            "code": category.code,
            "description": category.description,
            "parent_id": category.parent_id,
            "is_active": category.is_active,
            "sort_order": category.sort_order,
            "created_at": category.created_at,
            "payables_count": payables_count,
            "children_count": children_count
        }
        result.append(category_dict)
    
    return result


@router.get("/tree", response_model=List[PayableCategoryTree])
def get_payable_categories_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter árvore de categorias de contas a pagar"""
    def build_tree(parent_id=None):
        query = db.query(PayableCategory).filter(
            PayableCategory.company_id == current_user.company_id,
            PayableCategory.parent_id == parent_id,
            PayableCategory.is_active == True
        ).order_by(PayableCategory.sort_order, PayableCategory.name)
        
        categories = query.all()
        tree = []
        
        for category in categories:
            # Contar contas a pagar
            payables_count = db.query(AccountsPayable).filter(
                AccountsPayable.category_id == category.id
            ).count()
            
            # Contar filhos
            children_count = db.query(PayableCategory).filter(
                PayableCategory.parent_id == category.id
            ).count()
            
            category_dict = PayableCategoryTree(
                id=category.id,
                name=category.name,
                code=category.code,
                description=category.description,
                parent_id=category.parent_id,
                is_active=category.is_active,
                sort_order=category.sort_order,
                company_id=category.company_id,
                created_at=category.created_at,
                updated_at=category.updated_at,
                children_count=children_count,
                payables_count=payables_count,
                children=build_tree(category.id)
            )
            tree.append(category_dict)
        
        return tree
    
    return build_tree()


@router.post("/", response_model=PayableCategoryResponse)
def create_payable_category(
    category: PayableCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar nova categoria de contas a pagar"""
    # Verificar se o código já existe
    existing_category = db.query(PayableCategory).filter(
        PayableCategory.code == category.code,
        PayableCategory.company_id == current_user.company_id
    ).first()
    
    if existing_category:
        raise HTTPException(status_code=400, detail="Código já existe")
    
    # Verificar categoria pai se especificada
    if category.parent_id:
        parent_category = db.query(PayableCategory).filter(
            PayableCategory.id == category.parent_id,
            PayableCategory.company_id == current_user.company_id
        ).first()
        
        if not parent_category:
            raise HTTPException(status_code=404, detail="Categoria pai não encontrada")
    
    db_category = PayableCategory(
        **category.dict(),
        company_id=current_user.company_id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return PayableCategoryResponse(
        id=db_category.id,
        name=db_category.name,
        code=db_category.code,
        description=db_category.description,
        parent_id=db_category.parent_id,
        is_active=db_category.is_active,
        sort_order=db_category.sort_order,
        company_id=db_category.company_id,
        created_at=db_category.created_at,
        updated_at=db_category.updated_at,
        children_count=0,
        payables_count=0
    )


@router.get("/{category_id}", response_model=PayableCategoryResponse)
def get_payable_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter categoria específica de contas a pagar"""
    category = db.query(PayableCategory).filter(
        PayableCategory.id == category_id,
        PayableCategory.company_id == current_user.company_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Contar contas a pagar
    payables_count = db.query(AccountsPayable).filter(
        AccountsPayable.category_id == category.id
    ).count()
    
    # Contar filhos
    children_count = db.query(PayableCategory).filter(
        PayableCategory.parent_id == category.id
    ).count()
    
    return PayableCategoryResponse(
        id=category.id,
        name=category.name,
        code=category.code,
        description=category.description,
        parent_id=category.parent_id,
        is_active=category.is_active,
        sort_order=category.sort_order,
        company_id=category.company_id,
        created_at=category.created_at,
        updated_at=category.updated_at,
        children_count=children_count,
        payables_count=payables_count
    )


@router.put("/{category_id}", response_model=PayableCategoryResponse)
def update_payable_category(
    category_id: int,
    category_update: PayableCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar categoria de contas a pagar"""
    db_category = db.query(PayableCategory).filter(
        PayableCategory.id == category_id,
        PayableCategory.company_id == current_user.company_id
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Verificar se o código já existe (se estiver sendo alterado)
    if category_update.code and category_update.code != db_category.code:
        existing_category = db.query(PayableCategory).filter(
            PayableCategory.code == category_update.code,
            PayableCategory.company_id == current_user.company_id,
            PayableCategory.id != category_id
        ).first()
        
        if existing_category:
            raise HTTPException(status_code=400, detail="Código já existe")
    
    # Verificar categoria pai se especificada
    if category_update.parent_id is not None:
        if category_update.parent_id == category_id:
            raise HTTPException(status_code=400, detail="Categoria não pode ser pai de si mesma")
        
        if category_update.parent_id:
            parent_category = db.query(PayableCategory).filter(
                PayableCategory.id == category_update.parent_id,
                PayableCategory.company_id == current_user.company_id
            ).first()
            
            if not parent_category:
                raise HTTPException(status_code=404, detail="Categoria pai não encontrada")
    
    # Atualizar campos
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    
    # Contar contas a pagar
    payables_count = db.query(AccountsPayable).filter(
        AccountsPayable.category_id == db_category.id
    ).count()
    
    # Contar filhos
    children_count = db.query(PayableCategory).filter(
        PayableCategory.parent_id == db_category.id
    ).count()
    
    return PayableCategoryResponse(
        id=db_category.id,
        name=db_category.name,
        code=db_category.code,
        description=db_category.description,
        parent_id=db_category.parent_id,
        is_active=db_category.is_active,
        sort_order=db_category.sort_order,
        company_id=db_category.company_id,
        created_at=db_category.created_at,
        updated_at=db_category.updated_at,
        children_count=children_count,
        payables_count=payables_count
    )


@router.delete("/{category_id}")
def delete_payable_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Excluir categoria de contas a pagar"""
    db_category = db.query(PayableCategory).filter(
        PayableCategory.id == category_id,
        PayableCategory.company_id == current_user.company_id
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Verificar se há contas a pagar usando esta categoria
    payables_count = db.query(AccountsPayable).filter(
        AccountsPayable.category_id == category_id
    ).count()
    
    if payables_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível excluir a categoria. Existem {payables_count} contas a pagar associadas."
        )
    
    # Verificar se há categorias filhas
    children_count = db.query(PayableCategory).filter(
        PayableCategory.parent_id == category_id
    ).count()
    
    if children_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível excluir a categoria. Existem {children_count} subcategorias associadas."
        )
    
    db.delete(db_category)
    db.commit()
    
    return {"message": "Categoria excluída com sucesso"} 