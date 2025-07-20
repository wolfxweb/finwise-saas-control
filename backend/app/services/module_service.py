from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.plan import Module, PlanModule
from ..schemas.module import ModuleCreate, ModuleUpdate, PlanModuleCreate, PlanModuleUpdate
from typing import List, Optional
import uuid

class ModuleService:
    @staticmethod
    def create_module(db: Session, module_data: ModuleCreate) -> Module:
        db_module = Module(**module_data.dict())
        db.add(db_module)
        db.commit()
        db.refresh(db_module)
        return db_module

    @staticmethod
    def get_modules(db: Session, skip: int = 0, limit: int = 100) -> List[Module]:
        return db.query(Module).filter(Module.status == "active").offset(skip).limit(limit).all()

    @staticmethod
    def get_module(db: Session, module_id: str) -> Optional[Module]:
        return db.query(Module).filter(Module.id == module_id).first()

    @staticmethod
    def update_module(db: Session, module_id: str, module_data: ModuleUpdate) -> Optional[Module]:
        db_module = db.query(Module).filter(Module.id == module_id).first()
        if db_module:
            update_data = module_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_module, field, value)
            db.commit()
            db.refresh(db_module)
        return db_module

    @staticmethod
    def delete_module(db: Session, module_id: str) -> bool:
        db_module = db.query(Module).filter(Module.id == module_id).first()
        if db_module:
            db_module.status = "inactive"
            db.commit()
            return True
        return False

    @staticmethod
    def add_module_to_plan(db: Session, plan_module_data: PlanModuleCreate) -> PlanModule:
        # Verificar se já existe
        existing = db.query(PlanModule).filter(
            and_(
                PlanModule.plan_id == plan_module_data.plan_id,
                PlanModule.module_id == plan_module_data.module_id
            )
        ).first()
        
        if existing:
            # Atualizar se já existe
            for field, value in plan_module_data.dict().items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Criar novo
            db_plan_module = PlanModule(**plan_module_data.dict())
            db.add(db_plan_module)
            db.commit()
            db.refresh(db_plan_module)
            return db_plan_module

    @staticmethod
    def remove_module_from_plan(db: Session, plan_id: str, module_id: str) -> bool:
        db_plan_module = db.query(PlanModule).filter(
            and_(
                PlanModule.plan_id == plan_id,
                PlanModule.module_id == module_id
            )
        ).first()
        
        if db_plan_module:
            db.delete(db_plan_module)
            db.commit()
            return True
        return False

    @staticmethod
    def get_plan_modules(db: Session, plan_id: str) -> List[PlanModule]:
        return db.query(PlanModule).filter(PlanModule.plan_id == plan_id).all()

    @staticmethod
    def get_modules_by_plan(db: Session, plan_id: str) -> List[Module]:
        return db.query(Module).join(PlanModule).filter(
            and_(
                PlanModule.plan_id == plan_id,
                PlanModule.is_included == True
            )
        ).all()

    @staticmethod
    def update_plan_module(db: Session, plan_id: str, module_id: str, plan_module_data: PlanModuleUpdate) -> Optional[PlanModule]:
        db_plan_module = db.query(PlanModule).filter(
            and_(
                PlanModule.plan_id == plan_id,
                PlanModule.module_id == module_id
            )
        ).first()
        
        if db_plan_module:
            update_data = plan_module_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_plan_module, field, value)
            db.commit()
            db.refresh(db_plan_module)
        return db_plan_module 