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
    SupplierListResponse,
    SupplierContactCreate,
    SupplierContactUpdate,
    SupplierContactResponse,
    SupplierWithContactsResponse
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
        print(f"Dados recebidos: {supplier_data.dict()}")
        supplier = supplier_service.create_supplier(supplier_data, current_user.company_id)
        return supplier
    except Exception as e:
        print(f"Erro ao criar fornecedor: {str(e)}")
        import traceback
        traceback.print_exc()
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

@router.get("/{supplier_id}/with-contacts", response_model=SupplierWithContactsResponse)
def get_supplier_with_contacts(
    supplier_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Obter detalhes de um fornecedor com seus contatos"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    supplier = supplier_service.get_supplier_with_contacts(supplier_id, current_user.company_id)
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

# Endpoints para gerenciar contatos
@router.post("/{supplier_id}/contacts", response_model=SupplierContactResponse)
def create_contact(
    supplier_id: str,
    contact_data: SupplierContactCreate,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Criar um novo contato para o fornecedor"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    try:
        print(f"Dados do contato recebidos: {contact_data.dict()}")
        contact = supplier_service.create_contact(supplier_id, contact_data, current_user.company_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
        
        return contact
    except Exception as e:
        print(f"Erro ao criar contato: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{supplier_id}/contacts", response_model=List[SupplierContactResponse])
def get_contacts(
    supplier_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Listar todos os contatos de um fornecedor"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    contacts = supplier_service.get_contacts(supplier_id, current_user.company_id)
    return contacts

@router.get("/{supplier_id}/contacts/{contact_id}", response_model=SupplierContactResponse)
def get_contact(
    supplier_id: str,
    contact_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Obter detalhes de um contato específico"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    contact = supplier_service.get_contact_by_id(contact_id, supplier_id, current_user.company_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    
    return contact

@router.put("/{supplier_id}/contacts/{contact_id}", response_model=SupplierContactResponse)
def update_contact(
    supplier_id: str,
    contact_id: str,
    contact_data: SupplierContactUpdate,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Atualizar um contato"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    contact = supplier_service.update_contact(contact_id, supplier_id, contact_data, current_user.company_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    
    return contact

@router.delete("/{supplier_id}/contacts/{contact_id}")
def delete_contact(
    supplier_id: str,
    contact_id: str,
    current_user: User = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    """Deletar um contato (soft delete)"""
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Usuário não está associado a uma empresa")
    
    success = supplier_service.delete_contact(contact_id, supplier_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    
    return {"message": "Contato deletado com sucesso"} 