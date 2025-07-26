from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

# Enums
class TaxType(str, Enum):
    ICMS = "ICMS"
    IPI = "IPI"
    PIS = "PIS"
    COFINS = "COFINS"
    ISS = "ISS"
    II = "II"
    IOF = "IOF"

class MovementType(str, Enum):
    ENTRY = "entry"
    EXIT = "exit"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    RESERVATION = "reservation"
    RETURN = "return"

class MovementReason(str, Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ADJUSTMENT_POSITIVE = "adjustment_positive"
    ADJUSTMENT_NEGATIVE = "adjustment_negative"
    INVENTORY = "inventory"
    DAMAGED = "damaged"
    EXPIRED = "expired"
    LOSS = "loss"
    RETURN_CUSTOMER = "return_customer"
    RETURN_SUPPLIER = "return_supplier"

class ProductType(str, Enum):
    SIMPLE = "simple"
    VARIATION = "variation"
    COMPOSITE = "composite"

# Base schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    product_type: ProductType = ProductType.SIMPLE
    ncm: Optional[str] = Field(None, max_length=20)
    ean: Optional[str] = Field(None, max_length=20)
    gtin: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    weight: Optional[float] = Field(None, ge=0)
    length: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, ge=0)
    height: Optional[float] = Field(None, ge=0)
    is_active: bool = True
    is_service: bool = False
    
    # SKU principal
    sku: Optional[str] = Field(None, max_length=50)
    is_main_sku: Optional[bool] = False
    
    # Campos de Estoque
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    current_stock: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: Optional[int] = Field(None, ge=0)
    
    # Campos Fiscais
    cest: Optional[str] = Field(None, max_length=20)
    cfop: Optional[str] = Field(None, max_length=10)
    icms_st: Optional[float] = Field(None, ge=0)
    icms: Optional[float] = Field(None, ge=0)
    ipi: Optional[float] = Field(None, ge=0)
    pis: Optional[float] = Field(None, ge=0)
    cofins: Optional[float] = Field(None, ge=0)
    iss: Optional[float] = Field(None, ge=0)
    iof: Optional[float] = Field(None, ge=0)
    cide: Optional[float] = Field(None, ge=0)
    csll: Optional[float] = Field(None, ge=0)
    irrf: Optional[float] = Field(None, ge=0)
    inss: Optional[float] = Field(None, ge=0)
    fgts: Optional[float] = Field(None, ge=0)
    outros_impostos: Optional[float] = Field(None, ge=0)
    
    # Campos específicos para Marketplaces
    # Shopee
    shopee_category_id: Optional[str] = Field(None, max_length=50)
    shopee_category_name: Optional[str] = Field(None, max_length=100)
    shopee_attributes: Optional[Dict[str, Any]] = None
    shopee_warranty: Optional[str] = Field(None, max_length=100)
    shopee_brand_id: Optional[str] = Field(None, max_length=50)
    shopee_model_id: Optional[str] = Field(None, max_length=50)
    shopee_is_pre_order: bool = False
    shopee_logistics: Optional[Dict[str, Any]] = None
    
    # Mercado Livre
    mercadolivre_category_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_category_name: Optional[str] = Field(None, max_length=100)
    mercadolivre_attributes: Optional[Dict[str, Any]] = None
    mercadolivre_warranty: Optional[str] = Field(None, max_length=100)
    mercadolivre_brand_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_model_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_condition: Optional[str] = Field(None, max_length=20)
    mercadolivre_listing_type: Optional[str] = Field(None, max_length=20)
    mercadolivre_shipping: Optional[Dict[str, Any]] = None

class ProductSKUBase(BaseModel):
    sku_code: str = Field(..., min_length=1, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    size: Optional[str] = Field(None, max_length=20)
    material: Optional[str] = Field(None, max_length=100)
    flavor: Optional[str] = Field(None, max_length=50)
    variant_description: Optional[str] = None
    cost_price: float = Field(..., gt=0)
    sale_price: float = Field(..., gt=0)
    wholesale_price: Optional[float] = Field(None, ge=0)
    promotional_price: Optional[float] = Field(None, ge=0)
    current_stock: int = Field(0, ge=0)
    minimum_stock: int = Field(0, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: int = Field(0, ge=0)
    warehouse_location: Optional[str] = Field(None, max_length=100)
    shelf_location: Optional[str] = Field(None, max_length=50)
    taxes: Dict[str, float] = Field(default_factory=dict)
    supplier_sku: Optional[str] = Field(None, max_length=50)
    supplier_id: Optional[int] = None
    is_active: bool = True
    is_available_for_sale: bool = True
    is_stock_sku: bool = False
    stock_sku_id: Optional[int] = None

class StockMovementBase(BaseModel):
    movement_type: MovementType
    movement_reason: MovementReason
    quantity: int = Field(..., gt=0)
    reference_document: Optional[str] = Field(None, max_length=100)
    reference_id: Optional[int] = None
    from_location: Optional[str] = Field(None, max_length=100)
    to_location: Optional[str] = Field(None, max_length=100)
    unit_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

# Create schemas
class ProductCreate(ProductBase):
    pass

class ProductSKUCreate(ProductSKUBase):
    pass

class StockMovementCreate(StockMovementBase):
    product_id: int
    sku_id: int
    # company_id será obtido automaticamente do usuário autenticado

# Update schemas
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    ncm: Optional[str] = Field(None, max_length=20)
    ean: Optional[str] = Field(None, max_length=20)
    gtin: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    weight: Optional[float] = Field(None, ge=0)
    length: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, ge=0)
    height: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_service: Optional[bool] = None
    
    # SKU principal
    sku: Optional[str] = Field(None, max_length=50)
    is_main_sku: Optional[bool] = None
    
    # Campos de Estoque
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    current_stock: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: Optional[int] = Field(None, ge=0)
    
    # Campos Fiscais
    cest: Optional[str] = Field(None, max_length=20)
    cfop: Optional[str] = Field(None, max_length=10)
    icms_st: Optional[float] = Field(None, ge=0)
    icms: Optional[float] = Field(None, ge=0)
    ipi: Optional[float] = Field(None, ge=0)
    pis: Optional[float] = Field(None, ge=0)
    cofins: Optional[float] = Field(None, ge=0)
    iss: Optional[float] = Field(None, ge=0)
    iof: Optional[float] = Field(None, ge=0)
    cide: Optional[float] = Field(None, ge=0)
    csll: Optional[float] = Field(None, ge=0)
    irrf: Optional[float] = Field(None, ge=0)
    inss: Optional[float] = Field(None, ge=0)
    fgts: Optional[float] = Field(None, ge=0)
    outros_impostos: Optional[float] = Field(None, ge=0)
    
    # Campos específicos para Marketplaces
    # Shopee
    shopee_category_id: Optional[str] = Field(None, max_length=50)
    shopee_category_name: Optional[str] = Field(None, max_length=100)
    shopee_attributes: Optional[Dict[str, Any]] = None
    shopee_warranty: Optional[str] = Field(None, max_length=100)
    shopee_brand_id: Optional[str] = Field(None, max_length=50)
    shopee_model_id: Optional[str] = Field(None, max_length=50)
    shopee_is_pre_order: Optional[bool] = None
    shopee_logistics: Optional[Dict[str, Any]] = None
    
    # Mercado Livre
    mercadolivre_category_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_category_name: Optional[str] = Field(None, max_length=100)
    mercadolivre_attributes: Optional[Dict[str, Any]] = None
    mercadolivre_warranty: Optional[str] = Field(None, max_length=100)
    mercadolivre_brand_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_model_id: Optional[str] = Field(None, max_length=50)
    mercadolivre_condition: Optional[str] = Field(None, max_length=20)
    mercadolivre_listing_type: Optional[str] = Field(None, max_length=20)
    mercadolivre_shipping: Optional[Dict[str, Any]] = None

class ProductSKUUpdate(BaseModel):
    sku_code: Optional[str] = Field(None, min_length=1, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    size: Optional[str] = Field(None, max_length=20)
    material: Optional[str] = Field(None, max_length=100)
    flavor: Optional[str] = Field(None, max_length=50)
    variant_description: Optional[str] = None
    cost_price: Optional[float] = Field(None, gt=0)
    sale_price: Optional[float] = Field(None, gt=0)
    wholesale_price: Optional[float] = Field(None, ge=0)
    promotional_price: Optional[float] = Field(None, ge=0)
    current_stock: Optional[int] = Field(None, ge=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: Optional[int] = Field(None, ge=0)
    warehouse_location: Optional[str] = Field(None, max_length=100)
    shelf_location: Optional[str] = Field(None, max_length=50)
    taxes: Optional[Dict[str, float]] = None
    supplier_sku: Optional[str] = Field(None, max_length=50)
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_available_for_sale: Optional[bool] = None
    is_stock_sku: Optional[bool] = None
    stock_sku_id: Optional[int] = None

# Product Component schemas
class ProductComponentBase(BaseModel):
    component_product_id: int
    quantity: float = Field(..., gt=0)
    unit: str = Field("un", max_length=20)
    is_required: bool = True
    assembly_order: int = Field(0, ge=0)
    instructions: Optional[str] = None
    additional_cost: float = Field(0.0, ge=0)

class ProductComponentCreate(ProductComponentBase):
    pass

class ProductComponentUpdate(BaseModel):
    component_product_id: Optional[int] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=20)
    is_required: Optional[bool] = None
    assembly_order: Optional[int] = Field(None, ge=0)
    instructions: Optional[str] = None
    additional_cost: Optional[float] = Field(None, ge=0)

class ProductComponentResponse(ProductComponentBase):
    id: int
    composite_product_id: int
    component_product_name: str
    component_product_sku: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductComponentList(BaseModel):
    id: int
    component_product_id: int
    component_product_name: str
    quantity: float
    unit: str
    is_required: bool
    assembly_order: int
    additional_cost: float
    
    class Config:
        from_attributes = True

# Response schemas
class ProductSKUResponse(ProductSKUBase):
    id: int
    product_id: int
    available_stock: int
    stock_status: str
    total_tax_rate: float = 0.0
    price_with_taxes: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: int
    company_id: UUID
    skus: List[ProductSKUResponse] = []
    composite_components: List[ProductComponentResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StockMovementResponse(StockMovementBase):
    id: int
    product_id: int
    sku_id: int
    company_id: UUID
    previous_stock: int
    current_stock: int
    total_cost: float
    movement_description: str
    user_id: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# List schemas
class ProductList(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    ncm: Optional[str] = None
    is_active: bool
    sku_count: int
    total_stock: int
    is_main_sku: Optional[bool] = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductSKUList(BaseModel):
    id: int
    sku_code: str
    barcode: Optional[str] = None
    variant_description: Optional[str] = None
    cost_price: float
    sale_price: float
    current_stock: int
    available_stock: int
    stock_status: str
    is_active: bool
    is_available_for_sale: bool
    is_stock_sku: bool
    stock_sku_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class StockMovementList(BaseModel):
    id: int
    movement_type: MovementType
    movement_reason: MovementReason
    quantity: int
    previous_stock: int
    current_stock: int
    movement_description: str
    reference_document: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Filter schemas
class ProductFilter(BaseModel):
    search: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    ncm: Optional[str] = None
    is_active: Optional[bool] = None
    is_service: Optional[bool] = None

class ProductSKUFilter(BaseModel):
    search: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    stock_status: Optional[str] = None
    is_active: Optional[bool] = None
    is_available_for_sale: Optional[bool] = None
    supplier_id: Optional[int] = None

class StockMovementFilter(BaseModel):
    movement_type: Optional[MovementType] = None
    movement_reason: Optional[MovementReason] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reference_document: Optional[str] = None 