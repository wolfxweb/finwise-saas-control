from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from datetime import date

from ..models.company import Company, Branch
from ..models.plan import Plan, Module, CompanySubscription, CompanyModule
from ..schemas.company import CompanyCreate, CompanyUpdate, BranchCreate, BranchUpdate
from ..schemas.plan import CompanySubscriptionCreate, CompanyModuleCreate

class CompanyService:
    def __init__(self, db: Session):
        self.db = db

    def create_company(self, company_data: CompanyCreate) -> Company:
        """Criar nova empresa"""
        db_company = Company(**company_data.dict())
        self.db.add(db_company)
        self.db.commit()
        self.db.refresh(db_company)
        return db_company

    def get_company(self, company_id: UUID) -> Optional[Company]:
        """Obter empresa por ID"""
        return self.db.query(Company).filter(Company.id == company_id).first()

    def get_companies(self, skip: int = 0, limit: int = 100) -> List[Company]:
        """Listar empresas"""
        return self.db.query(Company).offset(skip).limit(limit).all()

    def update_company(self, company_id: UUID, company_data: CompanyUpdate) -> Optional[Company]:
        """Atualizar empresa"""
        db_company = self.get_company(company_id)
        if not db_company:
            return None
        
        update_data = company_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_company, field, value)
        
        self.db.commit()
        self.db.refresh(db_company)
        return db_company

    def delete_company(self, company_id: UUID) -> bool:
        """Deletar empresa"""
        db_company = self.get_company(company_id)
        if not db_company:
            return False
        
        self.db.delete(db_company)
        self.db.commit()
        return True

    def create_branch(self, branch_data: BranchCreate) -> Branch:
        """Criar nova filial"""
        db_branch = Branch(**branch_data.dict())
        self.db.add(db_branch)
        self.db.commit()
        self.db.refresh(db_branch)
        return db_branch

    def get_branches(self, company_id: UUID) -> List[Branch]:
        """Obter filiais da empresa"""
        return self.db.query(Branch).filter(Branch.company_id == company_id).all()

    def update_branch(self, branch_id: UUID, branch_data: BranchUpdate) -> Optional[Branch]:
        """Atualizar filial"""
        db_branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not db_branch:
            return None
        
        update_data = branch_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_branch, field, value)
        
        self.db.commit()
        self.db.refresh(db_branch)
        return db_branch

    def create_subscription(self, subscription_data: CompanySubscriptionCreate) -> CompanySubscription:
        """Criar assinatura para empresa"""
        db_subscription = CompanySubscription(**subscription_data.dict())
        self.db.add(db_subscription)
        self.db.commit()
        self.db.refresh(db_subscription)
        return db_subscription

    def get_company_subscriptions(self, company_id: UUID) -> List[CompanySubscription]:
        """Obter assinaturas da empresa"""
        return self.db.query(CompanySubscription).filter(
            CompanySubscription.company_id == company_id
        ).all()

    def add_module_to_company(self, company_id: UUID, module_id: UUID, subscription_id: UUID) -> CompanyModule:
        """Adicionar módulo à empresa"""
        # Obter preço do módulo
        module = self.db.query(Module).filter(Module.id == module_id).first()
        if not module:
            raise ValueError("Módulo não encontrado")
        
        # Criar associação empresa-módulo
        company_module = CompanyModule(
            company_id=company_id,
            module_id=module_id,
            subscription_id=subscription_id,
            price=module.price,
            start_date=date.today()
        )
        
        self.db.add(company_module)
        self.db.commit()
        self.db.refresh(company_module)
        return company_module

    def get_company_modules(self, company_id: UUID) -> List[str]:
        """Obter slugs dos módulos da empresa"""
        company_modules = self.db.query(CompanyModule).join(Module).filter(
            and_(
                CompanyModule.company_id == company_id,
                CompanyModule.status == "active"
            )
        ).all()
        
        return [cm.module.code for cm in company_modules if cm.module]

    def remove_module_from_company(self, company_id: UUID, module_id: UUID) -> bool:
        """Remover módulo da empresa"""
        company_module = self.db.query(CompanyModule).filter(
            and_(
                CompanyModule.company_id == company_id,
                CompanyModule.module_id == module_id,
                CompanyModule.status == "active"
            )
        ).first()
        
        if not company_module:
            return False
        
        company_module.status = "inactive"
        company_module.end_date = date.today()
        self.db.commit()
        return True

    def get_company_stats(self, company_id: UUID) -> dict:
        """Obter estatísticas da empresa"""
        # Contar usuários
        user_count = self.db.query(User).filter(
            and_(
                User.company_id == company_id,
                User.status == "active"
            )
        ).count()
        
        # Contar filiais
        branch_count = self.db.query(Branch).filter(
            and_(
                Branch.company_id == company_id,
                Branch.status == "active"
            )
        ).count()
        
        # Contar módulos ativos
        module_count = self.db.query(CompanyModule).filter(
            and_(
                CompanyModule.company_id == company_id,
                CompanyModule.status == "active"
            )
        ).count()
        
        # Obter assinatura ativa
        active_subscription = self.db.query(CompanySubscription).filter(
            and_(
                CompanySubscription.company_id == company_id,
                CompanySubscription.status == "active"
            )
        ).first()
        
        return {
            "user_count": user_count,
            "branch_count": branch_count,
            "module_count": module_count,
            "subscription": active_subscription
        } 