from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class PayableCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool = True
    sort_order: int = 0


class PayableCategoryCreate(PayableCategoryBase):
    pass


class PayableCategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class PayableCategoryResponse(PayableCategoryBase):
    id: int
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    children_count: int = 0
    payables_count: int = 0

    class Config:
        from_attributes = True


class PayableCategoryList(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool
    sort_order: int
    children_count: int = 0
    payables_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PayableCategoryTree(PayableCategoryResponse):
    children: List['PayableCategoryTree'] = []

    class Config:
        from_attributes = True


# Para resolver referência circular
PayableCategoryTree.model_rebuild() 