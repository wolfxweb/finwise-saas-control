from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FinanceMax API",
    description="API para o sistema FinanceMax",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FinanceMax API está funcionando!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "financemax-api"}

@app.get("/api/v1/status")
async def api_status():
    return {
        "status": "online",
        "version": "1.0.0",
        "service": "FinanceMax API"
    } 