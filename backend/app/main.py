from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .api.v1 import auth, admin, company, billing

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