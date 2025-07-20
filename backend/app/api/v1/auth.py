from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from uuid import uuid4
from pydantic import BaseModel

from ...core.database import get_db
from ...core.security import verify_token, create_access_token
from ...services.auth_service import AuthService
from ...services.company_service import CompanyService
from ...schemas.user import UserCreate, UserLogin, UserLoginResponse, User as UserSchema
from ...schemas.company import CompanyCreate
from ...models.plan import CompanySubscription, CompanyModule, Module, Plan, PlanModule
from ...models.company import Company
from ...models.user import User
from ...schemas.user import UserWithCompany

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Schema para registro de empresa
class CompanyRegistrationRequest(BaseModel):
    company: dict  # Dados da empresa
    user: dict  # Dados do usuário administrador
    plan: str
    trial_days: int = 30
    accept_terms: bool
    accept_marketing: bool

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
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    auth_service = AuthService(db)
    user = auth_service.get_current_user(user_id)
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/login", response_model=UserLoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Fazer login do usuário"""
    auth_service = AuthService(db)
    
    user_data = UserLogin(
        email=form_data.username,
        password=form_data.password
    )
    
    result = auth_service.login_user(user_data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserLoginResponse(
        access_token=result["access_token"],
        token_type=result["token_type"],
        user=result["user"],
        permissions=result["permissions"],
        modules=result["modules"]
    )

@router.post("/register", response_model=UserSchema)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Registrar novo usuário"""
    auth_service = AuthService(db)
    
    # Verificar se email já existe
    existing_user = auth_service.get_current_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = auth_service.create_user(user_data)
    return user

@router.post("/register-company")
def register_company(
    registration_data: CompanyRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Registrar nova empresa com usuário administrador"""
    print(f"Recebendo dados de registro: {registration_data}")
    
    # Verificar se aceitou os termos
    if not registration_data.accept_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você deve aceitar os termos de uso"
        )
    
    # Verificar se CNPJ já existe
    existing_company = db.query(Company).filter(Company.cnpj == registration_data.company["cnpj"]).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNPJ já cadastrado"
        )
    
    # Verificar se email da empresa já existe
    existing_company_email = db.query(Company).filter(Company.email == registration_data.company["email"]).first()
    if existing_company_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email da empresa já cadastrado"
        )
    
    # Verificar se email do usuário já existe
    existing_user = db.query(User).filter(User.email == registration_data.user["email"]).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email do usuário já cadastrado"
        )
    
    try:
        # Criar empresa usando CompanyCreate
        company_data = CompanyCreate(**registration_data.company)
        company_service = CompanyService(db)
        company = company_service.create_company(company_data)
        
        # Definir plano da empresa
        company.plan_type = registration_data.plan
        db.commit()
        
        # Criar assinatura com trial
        trial_end_date = datetime.utcnow() + timedelta(days=registration_data.trial_days)
        
        # Buscar plano para obter o preço
        plan = db.query(Plan).filter(Plan.name == registration_data.plan).first()
        plan_price = plan.price if plan else 0
        
        subscription = CompanySubscription(
            company_id=company.id,
            plan_id=plan.id if plan else None,
            status="trial",
            start_date=datetime.utcnow().date(),
            end_date=trial_end_date.date(),
            billing_cycle="monthly",
            total_price=plan_price
        )
        db.add(subscription)
        
        # Ativar módulos básicos do plano
        if plan:
            # Buscar módulos do plano
            plan_modules = db.query(PlanModule).filter(PlanModule.plan_id == plan.id).all()
            for plan_module in plan_modules:
                company_module = CompanyModule(
                    company_id=company.id,
                    module_id=plan_module.module_id,
                    subscription_id=subscription.id,
                    price=plan_module.module.price if plan_module.module else 0,
                    start_date=datetime.utcnow().date(),
                    status="active"
                )
                db.add(company_module)
        
        # Criar usuário administrador
        auth_service = AuthService(db)
        user_data = UserCreate(
            email=registration_data.user["email"],
            password=registration_data.user["password"],
            first_name=registration_data.user["first_name"],
            last_name=registration_data.user["last_name"],
            role="admin",
            company_id=company.id
        )
        
        user = auth_service.create_user(user_data)
        
        db.commit()
        
        # Gerar token de acesso para o usuário recém-criado
        permissions = auth_service.get_user_permissions(user.id)
        modules = auth_service.get_user_modules(user.id)
        
        access_token = create_access_token(
            subject=user.id,
            company_id=str(user.company_id),
            branch_id=str(user.branch_id) if user.branch_id else None,
            permissions=permissions,
            modules=modules
        )
        
        return {
            "message": "Empresa registrada com sucesso",
            "company_id": str(company.id),
            "user_id": str(user.id),
            "trial_end_date": trial_end_date.isoformat(),
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "permissions": permissions,
            "modules": modules
        }
        
    except Exception as e:
        db.rollback()
        print(f"Erro durante registro: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )

@router.get("/me", response_model=UserWithCompany)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obter informações do usuário atual"""
    auth_service = AuthService(db)
    
    # Obter permissões e módulos
    permissions = auth_service.get_user_permissions(current_user.id)
    modules = auth_service.get_user_modules(current_user.id)
    
    # Obter nome da empresa
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    company_name = company.name if company else None
    
    # Criar resposta com todas as informações
    user_data = {
        **current_user.__dict__,
        "company_name": company_name,
        "permissions": permissions,
        "modules": modules
    }
    
    return user_data

@router.post("/refresh")
def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renovar token de acesso"""
    auth_service = AuthService(db)
    
    permissions = auth_service.get_user_permissions(current_user.id)
    modules = auth_service.get_user_modules(current_user.id)
    
    access_token = create_access_token(
        subject=current_user.id,
        company_id=str(current_user.company_id),
        branch_id=str(current_user.branch_id) if current_user.branch_id else None,
        permissions=permissions,
        modules=modules
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    } 