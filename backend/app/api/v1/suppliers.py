from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.user import User
from app.services.supplier_service import SupplierService
from app.schemas.supplier import (
    SupplierCreate, 
    SupplierUpdate, 
    SupplierResponse, 
    SupplierListResponse
)

router = APIRouter()

def get_supplier_service(db: Session = Depends(get_db)) -> SupplierService:
    return SupplierService(db)

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier_data: SupplierCreate,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Criar um novo fornecedor para a empresa do usuário"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    try:
        supplier = supplier_service.create_supplier(supplier_data, current_user.company_id)
        return supplier
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=SupplierListResponse)
def get_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Listar fornecedores da empresa do usuário com filtros"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    suppliers, total = supplier_service.get_suppliers(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        category=category
    )
    
    total_pages = (total + limit - 1) // limit
    page = (skip // limit) + 1
    
    return SupplierListResponse(
        suppliers=suppliers,
        total=total,
        page=page,
        per_page=limit,
        total_pages=total_pages
    )

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Obter detalhes de um fornecedor específico"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    supplier = supplier_service.get_supplier_by_id(supplier_id, current_user.company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str,
    supplier_data: SupplierUpdate,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Atualizar um fornecedor"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    supplier = supplier_service.update_supplier(supplier_id, supplier_data, current_user.company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Deletar um fornecedor (soft delete)"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    success = supplier_service.delete_supplier(supplier_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    return {"message": "Fornecedor deletado com sucesso"}

@router.get("/stats/summary")
def get_supplier_stats(
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Obter estatísticas dos fornecedores da empresa"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    return supplier_service.get_supplier_stats(current_user.company_id)

@router.get("/stats/categories")
def get_suppliers_by_category(
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Obter fornecedores agrupados por categoria"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    return supplier_service.get_suppliers_by_category(current_user.company_id)

@router.get("/search/quick")
def quick_search_suppliers(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Busca rápida de fornecedores"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    suppliers = supplier_service.search_suppliers(current_user.company_id, q)
    return suppliers 