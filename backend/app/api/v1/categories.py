from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryList
from ..v1.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar uma nova categoria"""
    # Verificar se o código já existe
    existing_category = db.query(Category).filter(
        Category.code == category.code,
        Category.company_id == current_user.company_id
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de categoria já existe"
        )
    
    # Verificar se a categoria pai existe (se especificada)
    if category.parent_id:
        parent_category = db.query(Category).filter(
            Category.id == category.parent_id,
            Category.company_id == current_user.company_id
        ).first()
        
        if not parent_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria pai não encontrada"
            )
    
    db_category = Category(
        **category.dict(),
        company_id=current_user.company_id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/", response_model=List[CategoryList])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    active_only: bool = True
):
    """Listar categorias da empresa"""
    query = db.query(Category).filter(Category.company_id == current_user.company_id)
    
    if active_only:
        query = query.filter(Category.is_active == True)
    
    categories = query.order_by(Category.sort_order, Category.name).all()
    
    # Adicionar contadores
    result = []
    for category in categories:
        products_count = db.query(Category).filter(
            Category.id == category.id
        ).count()
        
        children_count = db.query(Category).filter(
            Category.parent_id == category.id,
            Category.company_id == current_user.company_id
        ).count()
        
        result.append(CategoryList(
            id=category.id,
            name=category.name,
            code=category.code,
            description=category.description,
            parent_id=category.parent_id,
            is_active=category.is_active,
            sort_order=category.sort_order,
            products_count=products_count,
            children_count=children_count,
            created_at=category.created_at
        ))
    
    return result

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter uma categoria específica"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.company_id == current_user.company_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar uma categoria"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.company_id == current_user.company_id
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    # Verificar se o código já existe (se estiver sendo alterado)
    if category_update.code and category_update.code != db_category.code:
        existing_category = db.query(Category).filter(
            Category.code == category_update.code,
            Category.company_id == current_user.company_id,
            Category.id != category_id
        ).first()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de categoria já existe"
            )
    
    # Verificar se a categoria pai existe (se especificada)
    if category_update.parent_id:
        parent_category = db.query(Category).filter(
            Category.id == category_update.parent_id,
            Category.company_id == current_user.company_id
        ).first()
        
        if not parent_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria pai não encontrada"
            )
    
    # Atualizar apenas os campos fornecidos
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar uma categoria"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.company_id == current_user.company_id
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    # Verificar se há produtos usando esta categoria
    products_count = db.query(Category).filter(
        Category.id == category_id
    ).count()
    
    if products_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível deletar uma categoria que possui produtos"
        )
    
    # Verificar se há subcategorias
    children_count = db.query(Category).filter(
        Category.parent_id == category_id,
        Category.company_id == current_user.company_id
    ).count()
    
    if children_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível deletar uma categoria que possui subcategorias"
        )
    
    db.delete(db_category)
    db.commit()
    
    return {"message": "Categoria deletada com sucesso"}

@router.get("/hierarchy/tree", response_model=List[CategoryResponse])
def get_category_hierarchy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter hierarquia de categorias em formato de árvore"""
    # Buscar apenas categorias raiz (sem parent_id)
    root_categories = db.query(Category).filter(
        Category.company_id == current_user.company_id,
        Category.parent_id.is_(None),
        Category.is_active == True
    ).order_by(Category.sort_order, Category.name).all()
    
    return root_categories 