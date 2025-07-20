from pydantic import BaseModel, UUID4
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class ModuleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None
    status: str = "active"

class ModuleCreate(ModuleBase):
    pass

class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    category: Optional[str] = None
    status: Optional[str] = None

class Module(ModuleBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanModuleBase(BaseModel):
    plan_id: UUID4
    module_id: UUID4
    is_included: bool = True
    price_override: Optional[Decimal] = None

class PlanModuleCreate(PlanModuleBase):
    pass

class PlanModuleUpdate(BaseModel):
    is_included: Optional[bool] = None
    price_override: Optional[Decimal] = None

class PlanModule(PlanModuleBase):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class PlanWithModules(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    price: Decimal
    billing_cycle: str
    max_users: int
    max_branches: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    modules: List[Module] = []

    class Config:
        from_attributes = True 