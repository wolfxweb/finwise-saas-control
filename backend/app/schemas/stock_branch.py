from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class StockBranchBase(BaseModel):
    current_stock: int = Field(0, ge=0)
    minimum_stock: int = Field(0, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: int = Field(0, ge=0)
    warehouse_location: Optional[str] = Field(None, max_length=100)
    shelf_location: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    is_active: bool = True

class StockBranchCreate(StockBranchBase):
    sku_id: int
    branch_id: UUID

class StockBranchUpdate(BaseModel):
    current_stock: Optional[int] = Field(None, ge=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: Optional[int] = Field(None, ge=0)
    warehouse_location: Optional[str] = Field(None, max_length=100)
    shelf_location: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class StockBranchResponse(StockBranchBase):
    id: int
    sku_id: int
    branch_id: UUID
    available_stock: int
    stock_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StockBranchList(BaseModel):
    id: int
    sku_id: int
    branch_id: UUID
    branch_name: str
    current_stock: int
    minimum_stock: int
    maximum_stock: Optional[int]
    available_stock: int
    stock_status: str
    warehouse_location: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True 