from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Base schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    code: str = Field(..., min_length=1, max_length=20)
    parent_id: Optional[int] = None
    is_active: bool = True
    sort_order: int = 0

# Create schema
class CategoryCreate(CategoryBase):
    pass

# Update schema
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

# Response schemas
class CategoryResponse(CategoryBase):
    id: int
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CategoryWithChildren(CategoryResponse):
    children: List['CategoryResponse'] = []
    products_count: int = 0

class CategoryList(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    parent_id: Optional[int]
    is_active: bool
    sort_order: int
    products_count: int
    children_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Para evitar referência circular
CategoryWithChildren.model_rebuild() 