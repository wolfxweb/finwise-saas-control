from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    billing_cycle: str = "monthly"
    max_users: int = 1
    max_branches: int = 1
    max_invoices: Optional[int] = 0
    marketplace_sync_limit: Optional[int] = 0

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    billing_cycle: Optional[str] = None
    max_users: Optional[int] = None
    max_branches: Optional[int] = None
    max_invoices: Optional[int] = None
    marketplace_sync_limit: Optional[int] = None
    status: Optional[str] = None

class Plan(PlanBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None

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
    id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanModuleBase(BaseModel):
    plan_id: UUID
    module_id: UUID
    is_included: bool = True
    price_override: Optional[Decimal] = None

class PlanModuleCreate(PlanModuleBase):
    pass

class PlanModule(PlanModuleBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class PlanWithModules(Plan):
    modules: List[PlanModule] = []

class CompanySubscriptionBase(BaseModel):
    company_id: UUID
    plan_id: Optional[UUID] = None
    start_date: date
    end_date: Optional[date] = None
    billing_cycle: str = "monthly"
    total_price: Decimal

class CompanySubscriptionCreate(CompanySubscriptionBase):
    pass

class CompanySubscriptionUpdate(BaseModel):
    plan_id: Optional[UUID] = None
    status: Optional[str] = None
    end_date: Optional[date] = None
    billing_cycle: Optional[str] = None
    total_price: Optional[Decimal] = None

class CompanySubscription(CompanySubscriptionBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CompanyModuleBase(BaseModel):
    company_id: UUID
    module_id: UUID
    subscription_id: UUID
    price: Decimal
    start_date: date
    end_date: Optional[date] = None

class CompanyModuleCreate(CompanyModuleBase):
    pass

class CompanyModuleUpdate(BaseModel):
    status: Optional[str] = None
    price: Optional[Decimal] = None
    end_date: Optional[date] = None

class CompanyModule(CompanyModuleBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CompanySubscriptionWithModules(CompanySubscription):
    modules: List[CompanyModule] = [] 