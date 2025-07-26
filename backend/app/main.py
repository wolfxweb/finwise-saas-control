from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .core.config import settings
import logging
from .core.database import engine, Base
from .models.supplier import Supplier, SupplierContact
from .models.nota_fiscal import NotaFiscal, NotaFiscalProduto
from .models.company import Company, Branch
from .models.user import User, Permission, UserPermission
from .models.product import Product
from .models.product_sku import ProductSKU
from .models.stock_branch import StockBranch
from .models.stock_movement import StockMovement
from .models.product_component import ProductComponent
from .models.category import Category
from .models.customer import Customer
from .api.v1 import auth, admin, company, billing, suppliers, nota_fiscal, products, categories, customers

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Sistema SaaS Multiempresa - FinanceMax",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["administration"])
app.include_router(company.router, prefix=f"{settings.API_V1_STR}/company", tags=["company"])
app.include_router(billing.router, prefix=f"{settings.API_V1_STR}/billing", tags=["billing"])
app.include_router(suppliers.router, prefix=f"{settings.API_V1_STR}/suppliers", tags=["suppliers"])
app.include_router(nota_fiscal.router, prefix=f"{settings.API_V1_STR}/notas-fiscais", tags=["notas-fiscais"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["categories"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["customers"])

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )

@app.get("/")
async def root():
    return {
        "message": "FinanceMax SaaS API está funcionando!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "financemax-saas-api",
        "version": "1.0.0"
    }

@app.get(f"{settings.API_V1_STR}/status")
async def api_status():
    return {
        "status": "online",
        "version": "1.0.0",
        "service": "FinanceMax SaaS API",
        "environment": "development"
    } 