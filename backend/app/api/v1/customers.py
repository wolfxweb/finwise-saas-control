from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.customer import Customer, CustomerType, CustomerStatus
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerList, CustomerFilter
)

router = APIRouter()

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar um novo cliente"""
    try:
        # Verificar se já existe cliente com mesmo email na empresa (apenas se email foi fornecido)
        if customer.email:
            existing_customer = db.query(Customer).filter(
                and_(
                    Customer.company_id == current_user.company_id,
                    Customer.email == customer.email
                )
            ).first()
            
            if existing_customer:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este email"
                )
        
        # Verificar se já existe cliente com mesmo CPF/CNPJ na empresa
        if customer.cpf or customer.cnpj:
            document = customer.cpf if customer.customer_type == CustomerType.INDIVIDUAL else customer.cnpj
            existing_document = db.query(Customer).filter(
                and_(
                    Customer.company_id == current_user.company_id,
                    or_(
                        Customer.cpf == document,
                        Customer.cnpj == document
                    )
                )
            ).first()
            
            if existing_document:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este documento"
                )
        
        db_customer = Customer(
            **customer.dict(),
            company_id=current_user.company_id
        )
        
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        
        return db_customer
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar cliente: {str(e)}"
        )

@router.get("/", response_model=List[CustomerList])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    customer_type: Optional[CustomerType] = None,
    status: Optional[CustomerStatus] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar clientes com filtros"""
    query = db.query(Customer).filter(Customer.company_id == current_user.company_id)
    
    # Aplicar filtros
    if search:
        search_filter = or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
            Customer.cpf.ilike(f"%{search}%"),
            Customer.cnpj.ilike(f"%{search}%"),
            Customer.contact_person.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    
    if status:
        query = query.filter(Customer.status == status)
    
    if city:
        query = query.filter(Customer.city.ilike(f"%{city}%"))
    
    if state:
        query = query.filter(Customer.state == state)
    
    if is_active is not None:
        if is_active:
            query = query.filter(Customer.status == CustomerStatus.ACTIVE)
        else:
            query = query.filter(Customer.status != CustomerStatus.ACTIVE)
    
    # Ordenar por nome
    query = query.order_by(Customer.name)
    
    # Paginação
    customers = query.offset(skip).limit(limit).all()
    
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de um cliente específico"""
    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.company_id == current_user.company_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar um cliente"""
    print(f"Atualizando cliente {customer_id} com dados: {customer_update.dict()}")  # Debug
    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.company_id == current_user.company_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    # Verificar se o novo email já existe (se foi alterado)
    if customer_update.email and customer_update.email != customer.email:
        existing_email = db.query(Customer).filter(
            and_(
                Customer.company_id == current_user.company_id,
                Customer.email == customer_update.email,
                Customer.id != customer_id
            )
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um cliente com este email"
            )
    
    # Verificar se o novo documento já existe (se foi alterado)
    if customer_update.cpf or customer_update.cnpj:
        new_document = customer_update.cpf if customer_update.customer_type == CustomerType.INDIVIDUAL else customer_update.cnpj
        current_document = customer.cpf if customer.customer_type == CustomerType.INDIVIDUAL else customer.cnpj
        
        if new_document and new_document != current_document:
            existing_document = db.query(Customer).filter(
                and_(
                    Customer.company_id == current_user.company_id,
                    or_(
                        Customer.cpf == new_document,
                        Customer.cnpj == new_document
                    ),
                    Customer.id != customer_id
                )
            ).first()
            
            if existing_document:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este documento"
                )
    
    # Atualizar campos
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar um cliente"""
    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.company_id == current_user.company_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    # Verificar se o cliente tem pedidos ou faturas (comentado até criar os modelos)
    # if customer.orders or customer.invoices:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Não é possível deletar um cliente que possui pedidos ou faturas"
    #     )
    
    db.delete(customer)
    db.commit()

@router.get("/reports/summary")
def get_customers_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Relatório resumido de clientes"""
    # Total de clientes
    total_customers = db.query(Customer).filter(
        Customer.company_id == current_user.company_id
    ).count()
    
    # Clientes ativos
    active_customers = db.query(Customer).filter(
        and_(
            Customer.company_id == current_user.company_id,
            Customer.status == CustomerStatus.ACTIVE
        )
    ).count()
    
    # Clientes por tipo
    individual_customers = db.query(Customer).filter(
        and_(
            Customer.company_id == current_user.company_id,
            Customer.customer_type == CustomerType.INDIVIDUAL
        )
    ).count()
    
    company_customers = db.query(Customer).filter(
        and_(
            Customer.company_id == current_user.company_id,
            Customer.customer_type == CustomerType.COMPANY
        )
    ).count()
    
    # Clientes bloqueados
    blocked_customers = db.query(Customer).filter(
        and_(
            Customer.company_id == current_user.company_id,
            Customer.status == CustomerStatus.BLOCKED
        )
    ).count()
    
    # Top 5 cidades com mais clientes
    top_cities = db.query(
        Customer.city,
        func.count(Customer.id).label('count')
    ).filter(
        and_(
            Customer.company_id == current_user.company_id,
            Customer.city.isnot(None)
        )
    ).group_by(Customer.city).order_by(func.count(Customer.id).desc()).limit(5).all()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": total_customers - active_customers,
        "blocked_customers": blocked_customers,
        "by_type": {
            "individual": individual_customers,
            "company": company_customers
        },
        "top_cities": [
            {"city": city, "count": count} for city, count in top_cities
        ]
    } 