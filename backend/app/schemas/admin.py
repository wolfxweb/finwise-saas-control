from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AdminStats(BaseModel):
    total_companies: int
    active_companies: int
    total_users: int
    total_revenue: float

class CompanyList(BaseModel):
    id: str
    name: str
    corporate_name: str
    cnpj: str
    email: str
    status: str
    plan_type: str
    created_at: str
    user_count: int

class CompanyDetail(BaseModel):
    id: str
    name: str
    corporate_name: str
    cnpj: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    status: str
    plan_type: str
    created_at: str
    updated_at: Optional[str]
    user_count: int
    active_modules: List[str]

class PlanList(BaseModel):
    id: str
    name: str
    description: str
    price: float
    billing_cycle: str
    max_users: int
    max_branches: int
    active_companies: int

class PlanDetail(BaseModel):
    id: str
    name: str
    description: str
    price: float
    billing_cycle: str
    max_users: int
    max_branches: int
    active_companies: int
    companies: List[CompanyList]

class ModuleList(BaseModel):
    id: str
    name: str
    code: str
    description: str
    price: float
    category: str
    active_subscriptions: int

class ModuleDetail(BaseModel):
    id: str
    name: str
    code: str
    description: str
    price: float
    category: str
    active_subscriptions: int
    companies: List[CompanyList] 