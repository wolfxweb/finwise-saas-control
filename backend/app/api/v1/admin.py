from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from sqlalchemy import text

from ...core.database import get_db
from ...models.user import User
from ...models.company import Company
from ...models.plan import Plan, Module, CompanyModule, PlanModule, CompanySubscription
from ...schemas.admin import (
    CompanyList, 
    PlanList, 
    ModuleList, 
    AdminStats,
    CompanyDetail,
    PlanDetail,
    ModuleDetail
)
from ...schemas.module import ModuleCreate, ModuleUpdate, PlanModuleCreate, PlanModuleUpdate
from ...services.module_service import ModuleService

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
    result = []
    
    for plan in plans:
        # Obter módulos do plano
        plan_modules = db.query(PlanModule).filter(
            PlanModule.plan_id == plan.id,
            PlanModule.is_included == True
        ).all()
        
        # Obter códigos dos módulos
        module_codes = []
        for plan_module in plan_modules:
            module = db.query(Module).filter(Module.id == plan_module.module_id).first()
            if module:
                module_codes.append(module.code)
        
        result.append(PlanList(
            id=str(plan.id),
            name=plan.name,
            description=plan.description,
            price=plan.price,
            billing_cycle=plan.billing_cycle,
            max_users=plan.max_users,
            max_branches=plan.max_branches,
            max_invoices=plan.max_invoices,
            marketplace_sync_limit=plan.marketplace_sync_limit,
            active_companies=db.query(Company).filter(
                Company.plan_type == plan.name,
                Company.status == "active"
            ).count(),
            modules=module_codes
        ))
    
    return result

@router.get("/public/plans", response_model=List[PlanList])
def get_public_plans(
    db: Session = Depends(get_db)
):
    """Listar todos os planos (endpoint público para página de vendas)"""
    plans = db.query(Plan).all()
    result = []
    
    for plan in plans:
        # Obter módulos do plano
        plan_modules = db.query(PlanModule).filter(
            PlanModule.plan_id == plan.id,
            PlanModule.is_included == True
        ).all()
        
        # Obter códigos dos módulos
        module_codes = []
        for plan_module in plan_modules:
            module = db.query(Module).filter(Module.id == plan_module.module_id).first()
            if module:
                module_codes.append(module.code)
        
        result.append(PlanList(
            id=str(plan.id),
            name=plan.name,
            description=plan.description,
            price=plan.price,
            billing_cycle=plan.billing_cycle,
            max_users=plan.max_users,
            max_branches=plan.max_branches,
            max_invoices=plan.max_invoices,
            marketplace_sync_limit=plan.marketplace_sync_limit,
            active_companies=db.query(Company).filter(
                Company.plan_type == plan.name,
                Company.status == "active"
            ).count(),
            modules=module_codes
        ))
    
    return result

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

@router.post("/plans", response_model=dict)
def create_plan(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    billing_cycle = data.get("billing_cycle")
    max_users = data.get("max_users")
    max_branches = data.get("max_branches")
    max_invoices = data.get("max_invoices")
    marketplace_sync_limit = data.get("marketplace_sync_limit")
    modules = data.get("modules", [])  # Lista de códigos dos módulos
    
    """Criar um novo plano"""
    # Verificar se já existe um plano com o mesmo nome
    existing_plan = db.query(Plan).filter(Plan.name == name).first()
    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um plano com este nome"
        )
    
    plan = Plan(
        name=name,
        description=description,
        price=price,
        billing_cycle=billing_cycle,
        max_users=max_users,
        max_branches=max_branches,
        max_invoices=max_invoices,
        marketplace_sync_limit=marketplace_sync_limit
    )
    
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    # Adicionar módulos ao plano
    if modules:
        for module_code in modules:
            module = db.query(Module).filter(Module.code == module_code).first()
            if module:
                plan_module = PlanModule(
                    plan_id=plan.id,
                    module_id=module.id,
                    is_included=True
                )
                db.add(plan_module)
        
        db.commit()
    
    return {
        "id": str(plan.id),
        "name": plan.name,
        "description": plan.description,
        "price": plan.price,
        "billing_cycle": plan.billing_cycle,
        "max_users": plan.max_users,
        "max_branches": plan.max_branches,
        "active_companies": 0
    }

@router.put("/plans/{plan_id}")
def update_plan(
    plan_id: UUID,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    billing_cycle = data.get("billing_cycle")
    max_users = data.get("max_users")
    max_branches = data.get("max_branches")
    max_invoices = data.get("max_invoices")
    marketplace_sync_limit = data.get("marketplace_sync_limit")
    modules = data.get("modules", [])  # Lista de códigos dos módulos
    
    """Atualizar um plano existente"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plano não encontrado"
        )
    
    # Verificar se o novo nome já existe (se estiver sendo alterado)
    if name and name != plan.name:
        existing_plan = db.query(Plan).filter(Plan.name == name).first()
        if existing_plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um plano com este nome"
            )
    
    # Atualizar campos fornecidos
    if name is not None:
        plan.name = name
    if description is not None:
        plan.description = description
    if price is not None:
        plan.price = price
    if billing_cycle is not None:
        plan.billing_cycle = billing_cycle
    if max_users is not None:
        plan.max_users = max_users
    if max_branches is not None:
        plan.max_branches = max_branches
    if max_invoices is not None:
        plan.max_invoices = max_invoices
    if marketplace_sync_limit is not None:
        plan.marketplace_sync_limit = marketplace_sync_limit
    
    # Atualizar módulos do plano
    if modules is not None:
        # Remover todos os módulos atuais
        db.query(PlanModule).filter(PlanModule.plan_id == plan.id).delete()
        
        # Adicionar os novos módulos
        for module_code in modules:
            module = db.query(Module).filter(Module.code == module_code).first()
            if module:
                plan_module = PlanModule(
                    plan_id=plan.id,
                    module_id=module.id,
                    is_included=True
                )
                db.add(plan_module)
        
        # Atualizar módulos de todas as empresas que usam este plano
        companies_using_plan = db.query(Company).filter(Company.plan_type == plan.name).all()
        
        for company in companies_using_plan:
            # Buscar a assinatura ativa da empresa (incluindo trial)
            subscription = db.query(CompanySubscription).filter(
                CompanySubscription.company_id == company.id,
                CompanySubscription.status.in_(["active", "trial"])
            ).first()
            
            if subscription:
                # Remover todos os módulos atuais da empresa
                db.query(CompanyModule).filter(
                    CompanyModule.subscription_id == subscription.id
                ).delete()
                
                # Adicionar os novos módulos baseados no plano atualizado
                for module_code in modules:
                    module = db.query(Module).filter(Module.code == module_code).first()
                    if module:
                        company_module = CompanyModule(
                            company_id=company.id,
                            module_id=module.id,
                            subscription_id=subscription.id,
                            status="active",
                            price=module.price,
                            start_date=subscription.start_date
                        )
                        db.add(company_module)
    
    db.commit()
    db.refresh(plan)
    
    return {"message": "Plano atualizado com sucesso e módulos das empresas atualizados"}

@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Excluir um plano"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plano não encontrado"
        )
    
    # Verificar se há empresas usando este plano
    companies_using_plan = db.query(Company).filter(Company.plan_type == plan.name).count()
    if companies_using_plan > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir o plano. {companies_using_plan} empresa(s) estão usando este plano."
        )
    
    # Primeiro remover todos os módulos associados ao plano
    db.query(PlanModule).filter(PlanModule.plan_id == plan_id).delete()
    
    # Depois excluir o plano
    db.delete(plan)
    db.commit()
    
    return {"message": "Plano excluído com sucesso"}

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

@router.put("/companies/{company_id}/plan")
def update_company_plan(
    company_id: UUID,
    plan_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar plano de uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Verificar se o plano existe
    plan = db.query(Plan).filter(Plan.name == plan_type).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plano inválido"
        )
    
    company.plan_type = plan_type
    db.commit()
    
    return {"message": f"Plano da empresa atualizado para {plan_type}"}

@router.put("/companies/{company_id}")
def update_company(
    company_id: UUID,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar dados de uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Extrair dados do payload
    name = data.get("name")
    corporate_name = data.get("corporate_name")
    cnpj = data.get("cnpj")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")
    city = data.get("city")
    state = data.get("state")
    zip_code = data.get("zip_code")
    
    # Verificar se o email já existe (se estiver sendo alterado)
    if email and email != company.email:
        existing_company = db.query(Company).filter(Company.email == email).first()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma empresa com este email"
            )
    
    # Verificar se o CNPJ já existe (se estiver sendo alterado)
    if cnpj and cnpj != company.cnpj:
        existing_company = db.query(Company).filter(Company.cnpj == cnpj).first()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma empresa com este CNPJ"
            )
    
    # Atualizar campos fornecidos
    if name is not None:
        company.name = name
    if corporate_name is not None:
        company.corporate_name = corporate_name
    if cnpj is not None:
        company.cnpj = cnpj
    if email is not None:
        company.email = email
    if phone is not None:
        company.phone = phone
    if address is not None:
        company.address = address
    if city is not None:
        company.city = city
    if state is not None:
        company.state = state
    if zip_code is not None:
        company.zip_code = zip_code
    
    db.commit()
    db.refresh(company)
    
    return {"message": "Empresa atualizada com sucesso"}

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

@router.put("/companies/{company_id}/users/{user_id}/status")
def update_user_status(
    company_id: UUID,
    user_id: UUID,
    status: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar status de um usuário"""
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == company_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if status not in ["active", "suspended", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status inválido"
        )
    
    user.status = status
    db.commit()
    
    return {"message": f"Status do usuário atualizado para {status}"}

@router.get("/users", response_model=List[dict])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Listar todos os usuários do sistema"""
    users = db.query(User).join(Company).all()
    
    return [
        {
            "id": str(user.id),
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "phone": None,  # Campo não existe no modelo atual
            "role": user.role,
            "company_name": user.company.name,
            "company_id": str(user.company_id),
            "status": user.status,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat(),
            "permissions": [],  # TODO: Implementar quando tiver sistema de permissões
            "is_admin": user.role == "admin"
        }
        for user in users
    ]

@router.put("/companies/{company_id}/users/inactivate-all")
def inactivate_all_users(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Inativar todos os usuários de uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Verificar se é a empresa master (não permitir inativação)
    if company.cnpj == "00.000.000/0001-00":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível inativar usuários da empresa master do sistema"
        )
    
    # Inativar todos os usuários da empresa
    users_updated = db.query(User).filter(
        User.company_id == company_id,
        User.status == "active"
    ).update({"status": "inactive"})
    
    db.commit()
    
    return {"message": f"{users_updated} usuário(s) inativado(s) com sucesso"}

@router.put("/companies/{company_id}/users/reactivate-all")
def reactivate_all_users(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Reativar todos os usuários de uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Verificar se é a empresa master (não permitir reativação)
    if company.cnpj == "00.000.000/0001-00":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível reativar usuários da empresa master do sistema"
        )
    
    # Reativar todos os usuários da empresa
    users_updated = db.query(User).filter(
        User.company_id == company_id,
        User.status == "inactive"
    ).update({"status": "active"})
    
    db.commit()
    
    return {"message": f"{users_updated} usuário(s) reativado(s) com sucesso"}

@router.delete("/companies/{company_id}")
def delete_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Excluir uma empresa"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Verificar se é a empresa master (não permitir exclusão)
    if company.cnpj == "00.000.000/0001-00":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível excluir a empresa master do sistema"
        )
    
    # Verificar se há usuários ativos na empresa
    active_users = db.query(User).filter(
        User.company_id == company_id,
        User.status == "active"
    ).count()
    
    if active_users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir empresa com {active_users} usuário(s) ativo(s). Suspenda os usuários primeiro."
        )
    
    # Excluir usuários da empresa
    db.query(User).filter(User.company_id == company_id).delete()
    
    # Excluir módulos da empresa
    db.query(CompanyModule).filter(CompanyModule.company_id == company_id).delete()

    # Excluir assinaturas da empresa
    db.execute(text('DELETE FROM company_subscriptions WHERE company_id = :company_id'), {'company_id': str(company_id)})
    
    # Excluir a empresa
    db.delete(company)
    db.commit()
    
    return {"message": "Empresa excluída com sucesso"}

# Endpoints para Módulos
@router.post("/modules", response_model=dict)
def create_module(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Criar novo módulo"""
    try:
        module_data = ModuleCreate(**data)
        module = ModuleService.create_module(db, module_data)
        return {
            "message": "Módulo criado com sucesso",
            "id": str(module.id),
            "name": module.name,
            "code": module.code
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar módulo: {str(e)}"
        )

@router.put("/modules/{module_id}")
def update_module(
    module_id: UUID,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Atualizar módulo"""
    try:
        module_data = ModuleUpdate(**data)
        module = ModuleService.update_module(db, str(module_id), module_data)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo não encontrado"
            )
        return {"message": "Módulo atualizado com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar módulo: {str(e)}"
        )

@router.delete("/modules/{module_id}")
def delete_module(
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Excluir módulo"""
    try:
        success = ModuleService.delete_module(db, str(module_id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo não encontrado"
            )
        return {"message": "Módulo excluído com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao excluir módulo: {str(e)}"
        )

# Endpoints para relacionamento Plan-Module
@router.post("/plans/{plan_id}/modules")
def add_module_to_plan(
    plan_id: UUID,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Adicionar módulo ao plano"""
    try:
        # Verificar se o plano existe
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plano não encontrado"
            )
        
        plan_module_data = PlanModuleCreate(
            plan_id=plan_id,
            **data
        )
        plan_module = ModuleService.add_module_to_plan(db, plan_module_data)
        return {"message": "Módulo adicionado ao plano com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao adicionar módulo ao plano: {str(e)}"
        )

@router.delete("/plans/{plan_id}/modules/{module_id}")
def remove_module_from_plan(
    plan_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Remover módulo do plano"""
    try:
        success = ModuleService.remove_module_from_plan(db, str(plan_id), str(module_id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Relação plano-módulo não encontrada"
            )
        return {"message": "Módulo removido do plano com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao remover módulo do plano: {str(e)}"
        )

@router.get("/plans/{plan_id}/modules")
def get_plan_modules(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin_access)
):
    """Obter módulos de um plano"""
    try:
        modules = ModuleService.get_modules_by_plan(db, str(plan_id))
        return [
            {
                "id": str(module.id),
                "name": module.name,
                "code": module.code,
                "description": module.description,
                "price": float(module.price),
                "category": module.category
            }
            for module in modules
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao obter módulos do plano: {str(e)}"
        ) 

@router.get("/master-company-id")
async def get_master_company_id(
    db: Session = Depends(get_db)
):
    """Retorna o ID da empresa master para configuração do frontend"""
    try:
        master_company = db.query(Company).filter(
            Company.cnpj == "00.000.000/0001-00"
        ).first()
        
        if not master_company:
            raise HTTPException(
                status_code=404, 
                detail="Empresa master não encontrada"
            )
        
        return {
            "master_company_id": str(master_company.id),
            "company_name": master_company.name
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar empresa master: {str(e)}"
        )

@router.get("/verify-master-admin")
async def verify_master_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifica se o usuário atual é um master admin"""
    try:
        # Buscar empresa master
        master_company = db.query(Company).filter(
            Company.cnpj == "00.000.000/0001-00"
        ).first()
        
        if not master_company:
            return {
                "is_master_admin": False,
                "message": "Empresa master não encontrada"
            }
        
        # Verificar se o usuário é admin e pertence à empresa master
        is_master_admin = (
            current_user.role == "admin" and 
            current_user.company_id == master_company.id
        )
        
        return {
            "is_master_admin": is_master_admin,
            "user_role": current_user.role,
            "user_company_id": str(current_user.company_id),
            "master_company_id": str(master_company.id),
            "message": "Master admin" if is_master_admin else "Não é master admin"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao verificar permissões: {str(e)}"
        ) 