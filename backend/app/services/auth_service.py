from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from ..models.user import User, Permission, UserPermission
from ..models.company import Company
from ..models.plan import CompanyModule, Module
from ..schemas.user import UserCreate, UserLogin
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.config import settings

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Autenticar usuário com email e senha"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def create_user(self, user_data: UserCreate) -> User:
        """Criar novo usuário"""
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            company_id=user_data.company_id,
            branch_id=user_data.branch_id
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user_permissions(self, user_id: UUID) -> List[str]:
        """Obter permissões do usuário"""
        permissions = self.db.query(UserPermission).filter(
            and_(
                UserPermission.user_id == user_id,
                UserPermission.granted == True
            )
        ).join(Permission).all()
        return [p.permission.code for p in permissions if p.permission and p.permission.code]

    def get_user_modules(self, user_id: UUID) -> List[str]:
        """Obter módulos disponíveis para o usuário"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        
        # Buscar módulos ativos da empresa
        modules = self.db.query(CompanyModule).filter(
            and_(
                CompanyModule.company_id == user.company_id,
                CompanyModule.status == "active"
            )
        ).join(Module).all()
        
        return [m.module.code for m in modules if m.module and m.module.code]

    def login_user(self, user_data: UserLogin) -> Optional[dict]:
        """Fazer login do usuário e retornar token"""
        user = self.authenticate_user(user_data.email, user_data.password)
        if not user:
            return None
        
        # Atualizar último login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # Obter permissões e módulos
        permissions = self.get_user_permissions(user.id)
        modules = self.get_user_modules(user.id)
        
        # Criar token de acesso
        access_token = create_access_token(
            subject=user.id,
            company_id=str(user.company_id),
            branch_id=str(user.branch_id) if user.branch_id else None,
            permissions=permissions,
            modules=modules
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "permissions": permissions,
            "modules": modules
        }

    def get_current_user(self, user_id: UUID) -> Optional[User]:
        """Obter usuário atual por ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_current_user_by_email(self, email: str) -> Optional[User]:
        """Obter usuário por email"""
        return self.db.query(User).filter(User.email == email).first()

    def verify_user_access(self, user_id: UUID, company_id: UUID) -> bool:
        """Verificar se usuário tem acesso à empresa"""
        user = self.db.query(User).filter(
            and_(
                User.id == user_id,
                User.company_id == company_id,
                User.status == "active"
            )
        ).first()
        return user is not None

    def verify_module_access(self, user_id: UUID, module_code: str) -> bool:
        """Verificar se usuário tem acesso ao módulo"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Verificar se módulo está ativo para a empresa
        module = self.db.query(CompanyModule).filter(
            and_(
                CompanyModule.company_id == user.company_id,
                CompanyModule.status == "active"
            )
        ).join(Module).filter(Module.code == module_code).first()
        
        return module is not None 