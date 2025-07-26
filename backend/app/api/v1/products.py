from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.product import Product
from app.models.product_sku import ProductSKU
from app.models.stock_movement import StockMovement, MovementType, MovementReason
from app.models.user import User
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductList,
    ProductSKUCreate, ProductSKUUpdate, ProductSKUResponse, ProductSKUList,
    StockMovementCreate, StockMovementResponse, StockMovementList,
    ProductFilter, ProductSKUFilter, StockMovementFilter
)

router = APIRouter()

# ==================== PRODUTOS ====================

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar um novo produto"""
    try:
        print(f"Tentando criar produto: {product.name}")
        print(f"Usuário logado: {current_user.email}")
        print(f"Company ID do usuário: {current_user.company_id}")
        print(f"Dados recebidos: {product.dict()}")
        
        # Verificar se já existe produto com mesmo nome na empresa
        existing_product = db.query(Product).filter(
            and_(
                Product.company_id == current_user.company_id,
                Product.name == product.name
            )
        ).first()
        
        if existing_product:
            print(f"Produto já existe: {product.name}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um produto com este nome"
            )
        
        db_product = Product(
            **product.dict(),
            company_id=current_user.company_id
        )
        
        print(f"Criando produto no banco: {db_product.name} com company_id: {db_product.company_id}")
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        print(f"Produto criado com sucesso: {db_product.id}")
        return db_product
        
    except Exception as e:
        print(f"Erro ao criar produto: {str(e)}")
        print(f"Tipo do erro: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise

@router.get("/", response_model=List[ProductList])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    ncm: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_service: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar produtos com filtros"""
    print(f"Listando produtos para usuário: {current_user.email}")
    print(f"Company ID do usuário: {current_user.company_id}")
    
    query = db.query(Product).filter(Product.company_id == current_user.company_id)
    
    # Por padrão, mostrar apenas produtos ativos
    if is_active is None:
        query = query.filter(Product.is_active == True)
    
    # Aplicar filtros
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.brand.ilike(f"%{search}%"),
            Product.model.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if category:
        query = query.filter(Product.category == category)
    
    if brand:
        query = query.filter(Product.brand == brand)
    
    if ncm:
        query = query.filter(Product.ncm == ncm)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    if is_service is not None:
        query = query.filter(Product.is_service == is_service)
    
    # Contar SKUs e estoque total
    products = query.options(joinedload(Product.skus)).offset(skip).limit(limit).all()
    
    result = []
    for product in products:
        # Filtrar apenas SKUs ativos
        active_skus = [sku for sku in product.skus if sku.is_active]
        sku_count = len(active_skus)
        total_stock = sum(sku.current_stock for sku in active_skus)
        

        
        result.append(ProductList(
            id=product.id,
            name=product.name,
            description=product.description,
            category=product.category,
            ncm=product.ncm,
            is_active=product.is_active,
            sku_count=sku_count,
            total_stock=total_stock,
            is_main_sku=product.is_main_sku,
            created_at=product.created_at
        ))
    
    return result

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter produto específico com SKUs"""
    product = db.query(Product).options(
        joinedload(Product.skus)
    ).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar produto"""
    db_product = db.query(Product).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Verificar se o novo nome já existe (se foi alterado)
    if product_update.name and product_update.name != db_product.name:
        existing_product = db.query(Product).filter(
            and_(
                Product.company_id == current_user.company_id,
                Product.name == product_update.name,
                Product.id != product_id
            )
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um produto com este nome"
            )
    
    # Atualizar apenas campos fornecidos
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar produto (soft delete)"""
    db_product = db.query(Product).options(
        joinedload(Product.skus)
    ).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Verificar se o produto tem SKUs associados
    if db_product.skus:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover um produto que possui SKUs associados"
        )
    
    # Soft delete - apenas desativar
    db_product.is_active = False
    db.commit()
    
    return None

# ==================== SKUs ====================

@router.post("/{product_id}/skus", response_model=ProductSKUResponse, status_code=status.HTTP_201_CREATED)
def create_product_sku(
    product_id: int,
    sku: ProductSKUCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar SKU para um produto"""
    # Verificar se o produto existe e pertence à empresa
    product = db.query(Product).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Verificar se já existe SKU com mesmo código
    existing_sku = db.query(ProductSKU).filter(
        and_(
            ProductSKU.product_id == product_id,
            ProductSKU.sku_code == sku.sku_code
        )
    ).first()
    
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um SKU com este código"
        )
    
    # Validações para estoque compartilhado
    if sku.is_stock_sku and sku.stock_sku_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU de estoque não pode ter referência a outro SKU de estoque"
        )
    
    if not sku.is_stock_sku and sku.stock_sku_id:
        # Verificar se o SKU de estoque referenciado existe e é válido
        stock_sku = db.query(ProductSKU).filter(
            and_(
                ProductSKU.id == sku.stock_sku_id,
                ProductSKU.product_id == product_id,
                ProductSKU.is_stock_sku == True
            )
        ).first()
        
        if not stock_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU de estoque referenciado não existe ou não é válido"
            )
    
    db_sku = ProductSKU(
        **sku.dict(),
        product_id=product_id
    )
    
    db.add(db_sku)
    db.commit()
    db.refresh(db_sku)
    
    return db_sku

@router.post("/{product_id}/associate-skus", status_code=status.HTTP_200_OK)
def associate_product_skus(
    product_id: int,
    associated_product_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Associar SKUs de outros produtos a este produto"""
    # Verificar se o produto existe e pertence à empresa
    product = db.query(Product).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Buscar SKUs dos produtos associados
    associated_skus = db.query(ProductSKU).filter(
        and_(
            ProductSKU.product_id.in_(associated_product_ids),
            ProductSKU.is_stock_sku == True,  # Apenas SKUs de estoque
            ProductSKU.is_active == True
        )
    ).all()
    
    # Criar SKUs associados para o produto atual
    created_skus = []
    for stock_sku in associated_skus:
        # Verificar se já existe um SKU associado para este stock_sku
        existing_associated = db.query(ProductSKU).filter(
            and_(
                ProductSKU.product_id == product_id,
                ProductSKU.stock_sku_id == stock_sku.id,
                ProductSKU.is_stock_sku == False
            )
        ).first()
        
        if not existing_associated:
            # Criar novo SKU associado
            associated_sku = ProductSKU(
                product_id=product_id,
                sku_code=f"{product.name}_{stock_sku.sku_code}",
                barcode=stock_sku.barcode,
                color=stock_sku.color,
                size=stock_sku.size,
                material=stock_sku.material,
                flavor=stock_sku.flavor,
                cost_price=stock_sku.cost_price,
                sale_price=stock_sku.sale_price,
                current_stock=0,  # Estoque compartilhado
                minimum_stock=stock_sku.minimum_stock,
                maximum_stock=stock_sku.maximum_stock,
                reserved_stock=0,
                warehouse_location=stock_sku.warehouse_location,
                taxes=stock_sku.taxes,
                supplier_id=stock_sku.supplier_id,
                is_stock_sku=False,
                stock_sku_id=stock_sku.id,
                is_active=True,
                is_available_for_sale=True
            )
            db.add(associated_sku)
            created_skus.append(associated_sku)
    
    db.commit()
    
    return {
        "message": f"Associados {len(created_skus)} SKUs ao produto",
        "created_skus": len(created_skus)
    }

@router.get("/{product_id}/skus", response_model=List[ProductSKUList])
def get_product_skus(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    stock_status: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_available_for_sale: Optional[bool] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar SKUs de um produto"""
    # Verificar se o produto existe e pertence à empresa
    product = db.query(Product).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    query = db.query(ProductSKU).filter(ProductSKU.product_id == product_id)
    
    # Aplicar filtros
    if search:
        search_filter = or_(
            ProductSKU.sku_code.ilike(f"%{search}%"),
            ProductSKU.barcode.ilike(f"%{search}%"),
            ProductSKU.variant_description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if color:
        query = query.filter(ProductSKU.color == color)
    
    if size:
        query = query.filter(ProductSKU.size == size)
    
    if stock_status:
        if stock_status == "out_of_stock":
            query = query.filter(ProductSKU.current_stock <= 0)
        elif stock_status == "low_stock":
            query = query.filter(
                and_(
                    ProductSKU.current_stock > 0,
                    ProductSKU.current_stock <= ProductSKU.minimum_stock
                )
            )
        elif stock_status == "in_stock":
            query = query.filter(ProductSKU.current_stock > ProductSKU.minimum_stock)
    
    if is_active is not None:
        query = query.filter(ProductSKU.is_active == is_active)
    
    if is_available_for_sale is not None:
        query = query.filter(ProductSKU.is_available_for_sale == is_available_for_sale)
    
    if supplier_id:
        query = query.filter(ProductSKU.supplier_id == supplier_id)
    
    skus = query.offset(skip).limit(limit).all()
    
    result = []
    for sku in skus:
        result.append(ProductSKUList(
            id=sku.id,
            sku_code=sku.sku_code,
            barcode=sku.barcode,
            variant_description=sku.variant_description,
            cost_price=sku.cost_price,
            sale_price=sku.sale_price,
            current_stock=sku.current_stock,
            available_stock=sku.available_stock,
            stock_status=sku.stock_status,
            is_active=sku.is_active,
            is_available_for_sale=sku.is_available_for_sale,
            is_stock_sku=sku.is_stock_sku,
            stock_sku_id=sku.stock_sku_id,
            created_at=sku.created_at
        ))
    
    return result

@router.get("/skus/{sku_id}", response_model=ProductSKUResponse)
def get_sku(
    sku_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter SKU específico"""
    sku = db.query(ProductSKU).join(Product).filter(
        and_(
            ProductSKU.id == sku_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU não encontrado"
        )
    
    return sku

@router.put("/skus/{sku_id}", response_model=ProductSKUResponse)
def update_sku(
    sku_id: int,
    sku_update: ProductSKUUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar SKU"""
    db_sku = db.query(ProductSKU).join(Product).filter(
        and_(
            ProductSKU.id == sku_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not db_sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU não encontrado"
        )
    
    # Verificar se o novo código já existe (se foi alterado)
    if sku_update.sku_code and sku_update.sku_code != db_sku.sku_code:
        existing_sku = db.query(ProductSKU).filter(
            and_(
                ProductSKU.product_id == db_sku.product_id,
                ProductSKU.sku_code == sku_update.sku_code,
                ProductSKU.id != sku_id
            )
        ).first()
        
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um SKU com este código"
            )
    
    # Atualizar apenas campos fornecidos
    update_data = sku_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_sku, field, value)
    
    db.commit()
    db.refresh(db_sku)
    
    return db_sku

@router.delete("/skus/{sku_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sku(
    sku_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar SKU"""
    db_sku = db.query(ProductSKU).join(Product).filter(
        and_(
            ProductSKU.id == sku_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not db_sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU não encontrado"
        )
    
    # Verificar se é um SKU principal de estoque
    if db_sku.is_stock_sku:
        # Verificar se há SKUs associados a este SKU de estoque
        associated_skus = db.query(ProductSKU).filter(
            ProductSKU.stock_sku_id == sku_id
        ).count()
        
        if associated_skus > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover um SKU de estoque que possui SKUs associados"
            )
    
    # Soft delete - apenas desativar
    db_sku.is_active = False
    db.commit()
    
    return None

# ==================== MOVIMENTAÇÕES DE ESTOQUE ====================

@router.post("/skus/{sku_id}/movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def create_stock_movement(
    sku_id: int,
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar movimentação de estoque"""
    # Verificar se o SKU existe e pertence à empresa
    sku = db.query(ProductSKU).join(Product).filter(
        and_(
            ProductSKU.id == sku_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU não encontrado"
        )
    
    # Verificar se o SKU_id na movimentação corresponde
    if movement.sku_id != sku_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU ID não corresponde"
        )
    
    # Verificar se o produto_id na movimentação corresponde
    if movement.product_id != sku.product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product ID não corresponde"
        )
    
    # Calcular estoques
    previous_stock = sku.current_stock
    
    # Aplicar movimentação
    if movement.movement_type == MovementType.ENTRY:
        new_stock = previous_stock + movement.quantity
    elif movement.movement_type == MovementType.EXIT:
        if previous_stock < movement.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estoque insuficiente para saída"
            )
        new_stock = previous_stock - movement.quantity
    elif movement.movement_type == MovementType.ADJUSTMENT:
        new_stock = movement.quantity  # Ajuste define o estoque diretamente
    else:
        new_stock = previous_stock  # Outros tipos não alteram estoque
    
    # Atualizar estoque do SKU
    sku.current_stock = new_stock
    
    # Criar movimentação
    db_movement = StockMovement(
        **movement.dict(),
        company_id=current_user.company_id,
        previous_stock=previous_stock,
        current_stock=new_stock,
        total_cost=movement.calculate_total_cost(),
        user_id=current_user.id
    )
    
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    
    return db_movement

@router.get("/skus/{sku_id}/movements", response_model=List[StockMovementList])
def get_sku_movements(
    sku_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    movement_type: Optional[MovementType] = None,
    movement_reason: Optional[MovementReason] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    reference_document: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar movimentações de um SKU"""
    # Verificar se o SKU existe e pertence à empresa
    sku = db.query(ProductSKU).join(Product).filter(
        and_(
            ProductSKU.id == sku_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU não encontrado"
        )
    
    query = db.query(StockMovement).filter(StockMovement.sku_id == sku_id)
    
    # Aplicar filtros
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    if movement_reason:
        query = query.filter(StockMovement.movement_reason == movement_reason)
    
    if start_date:
        query = query.filter(StockMovement.created_at >= start_date)
    
    if end_date:
        query = query.filter(StockMovement.created_at <= end_date)
    
    if reference_document:
        query = query.filter(StockMovement.reference_document.ilike(f"%{reference_document}%"))
    
    movements = query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for movement in movements:
        result.append(StockMovementList(
            id=movement.id,
            movement_type=movement.movement_type,
            movement_reason=movement.movement_reason,
            quantity=movement.quantity,
            previous_stock=movement.previous_stock,
            current_stock=movement.current_stock,
            movement_description=movement.movement_description,
            reference_document=movement.reference_document,
            created_at=movement.created_at
        ))
    
    return result

# ==================== SKUs DE ESTOQUE ====================

@router.get("/{product_id}/stock-skus")
def get_stock_skus(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar SKUs de estoque disponíveis para associação"""
    # Verificar se o produto existe e pertence à empresa
    product = db.query(Product).filter(
        and_(
            Product.id == product_id,
            Product.company_id == current_user.company_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Buscar SKUs de estoque do produto
    stock_skus = db.query(ProductSKU).filter(
        and_(
            ProductSKU.product_id == product_id,
            ProductSKU.is_stock_sku == True,
            ProductSKU.is_active == True
        )
    ).all()
    
    result = []
    for sku in stock_skus:
        result.append({
            "id": sku.id,
            "sku_code": sku.sku_code,
            "variant_description": sku.variant_description,
            "current_stock": sku.current_stock,
            "available_stock": sku.available_stock,
            "associated_skus_count": len(sku.associated_skus)
        })
    
    return result

# ==================== RELATÓRIOS ====================

@router.get("/reports/stock-status")
def get_stock_status_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Relatório de status do estoque"""
    # Estatísticas gerais
    total_products = db.query(Product).filter(
        Product.company_id == current_user.company_id
    ).count()
    
    total_skus = db.query(ProductSKU).join(Product).filter(
        Product.company_id == current_user.company_id
    ).count()
    
    # Status do estoque
    out_of_stock = db.query(ProductSKU).join(Product).filter(
        and_(
            Product.company_id == current_user.company_id,
            ProductSKU.current_stock <= 0
        )
    ).count()
    
    low_stock = db.query(ProductSKU).join(Product).filter(
        and_(
            Product.company_id == current_user.company_id,
            ProductSKU.current_stock > 0,
            ProductSKU.current_stock <= ProductSKU.minimum_stock
        )
    ).count()
    
    in_stock = db.query(ProductSKU).join(Product).filter(
        and_(
            Product.company_id == current_user.company_id,
            ProductSKU.current_stock > ProductSKU.minimum_stock
        )
    ).count()
    
    # Valor total do estoque
    total_value = db.query(func.sum(ProductSKU.current_stock * ProductSKU.cost_price)).join(Product).filter(
        Product.company_id == current_user.company_id
    ).scalar() or 0
    
    return {
        "total_products": total_products,
        "total_skus": total_skus,
        "stock_status": {
            "out_of_stock": out_of_stock,
            "low_stock": low_stock,
            "in_stock": in_stock
        },
        "total_stock_value": float(total_value)
    } 