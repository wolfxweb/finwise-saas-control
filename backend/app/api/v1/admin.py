from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...core.database import get_db
from ...models.user import User
from ...models.company import Company
from ...models.plan import Plan, Module, CompanyModule
from ...schemas.admin import (
    CompanyList, 
    PlanList, 
    ModuleList, 
    AdminStats,
    CompanyDetail,
    PlanDetail,
    ModuleDetail
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Obter usuário atual através do token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    from ...core.security import verify_token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    from ...services.auth_service import AuthService
    auth_service = AuthService(db)
    user = auth_service.get_current_user(user_id)
    if user is None:
        raise credentials_exception
    
    return user

def verify_admin_access(current_user: User = Depends(get_current_user)):
    """Verificar se o usuário é admin master"""
    if not current_user or current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso."
        )
    return current_user

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter estatísticas administrativas"""
    total_companies = db.query(Company).count()
    active_companies = db.query(Company).filter(Company.status == "active").count()
    total_users = db.query(User).count()
    
    # Calcular receita total (simplificado)
    total_revenue = 0
    companies = db.query(Company).filter(Company.status == "active").all()
    for company in companies:
        if company.plan_type == "Básico":
            total_revenue += 99.00
        elif company.plan_type == "Profissional":
            total_revenue += 199.00
        elif company.plan_type == "Empresarial":
            total_revenue += 399.00
    
    return AdminStats(
        total_companies=total_companies,
        active_companies=active_companies,
        total_users=total_users,
        total_revenue=total_revenue
    )

@router.get("/companies", response_model=List[CompanyList])
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Listar todas as empresas"""
    companies = db.query(Company).all()
    return [
        CompanyList(
            id=str(company.id),
            name=company.name,
            corporate_name=company.corporate_name,
            cnpj=company.cnpj,
            email=company.email,
            status=company.status,
            plan_type=company.plan_type,
            created_at=company.created_at.isoformat(),
            user_count=db.query(User).filter(User.company_id == company.id).count()
        )
        for company in companies
    ]

@router.get("/companies/{company_id}", response_model=CompanyDetail)
def get_company_detail(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter detalhes de uma empresa específica"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    users = db.query(User).filter(User.company_id == company_id).all()
    modules = db.query(CompanyModule).filter(CompanyModule.company_id == company_id).all()
    
    return CompanyDetail(
        id=str(company.id),
        name=company.name,
        corporate_name=company.corporate_name,
        cnpj=company.cnpj,
        email=company.email,
        phone=company.phone,
        address=company.address,
        city=company.city,
        state=company.state,
        zip_code=company.zip_code,
        status=company.status,
        plan_type=company.plan_type,
        created_at=company.created_at.isoformat(),
        updated_at=company.updated_at.isoformat() if company.updated_at else None,
        user_count=len(users),
        active_modules=[m.module.code for m in modules if m.status == "active"]
    )

@router.get("/plans", response_model=List[PlanList])
def get_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Listar todos os planos"""
    plans = db.query(Plan).all()
    return [
        PlanList(
            id=str(plan.id),
            name=plan.name,
            description=plan.description,
            price=plan.price,
            billing_cycle=plan.billing_cycle,
            max_users=plan.max_users,
            max_branches=plan.max_branches,
            active_companies=db.query(Company).filter(
                Company.plan_type == plan.name,
                Company.status == "active"
            ).count()
        )
        for plan in plans
    ]

@router.get("/modules", response_model=List[ModuleList])
def get_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Listar todos os módulos"""
    modules = db.query(Module).all()
    return [
        ModuleList(
            id=str(module.id),
            name=module.name,
            code=module.code,
            description=module.description,
            price=module.price,
            category=module.category,
            active_subscriptions=db.query(CompanyModule).filter(
                CompanyModule.module_id == module.id,
                CompanyModule.status == "active"
            ).count()
        )
        for module in modules
    ]

@router.put("/companies/{company_id}/status")
def update_company_status(
    company_id: UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar status de uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    if status not in ["active", "suspended", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status inválido"
        )
    
    company.status = status
    db.commit()
    
    return {"message": f"Status da empresa atualizado para {status}"}

@router.post("/companies/{company_id}/modules/{module_id}/subscribe")
def subscribe_company_to_module(
    company_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Inscrever empresa em um módulo"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado"
        )
    
    # Verificar se já está inscrito
    existing = db.query(CompanyModule).filter(
        CompanyModule.company_id == company_id,
        CompanyModule.module_id == module_id
    ).first()
    
    if existing:
        existing.status = "active"
    else:
        company_module = CompanyModule(
            company_id=company_id,
            module_id=module_id,
            status="active"
        )
        db.add(company_module)
    
    db.commit()
    return {"message": f"Empresa inscrita no módulo {module.name}"}

@router.post("/companies/{company_id}/modules/{module_id}/unsubscribe")
def unsubscribe_company_from_module(
    company_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Cancelar inscrição da empresa em um módulo"""
    company_module = db.query(CompanyModule).filter(
        CompanyModule.company_id == company_id,
        CompanyModule.module_id == module_id
    ).first()
    
    if not company_module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    company_module.status = "inactive"
    db.commit()
    
    return {"message": "Inscrição cancelada com sucesso"} 