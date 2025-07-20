#!/bin/bash

# Script de inicialização do container SaaS

echo "🚀 Iniciando FinanceMax SaaS Backend..."

# Função para aguardar o PostgreSQL estar pronto
wait_for_postgres() {
    echo "⏳ Aguardando PostgreSQL estar pronto..."
    while ! pg_isready -h postgres -p 5432 -U finwise_user; do
        sleep 2
    done
    echo "✅ PostgreSQL está pronto!"
}

# Função para aguardar o Redis estar pronto usando Python
wait_for_redis() {
    echo "⏳ Aguardando Redis estar pronto..."
    python -c "
import redis
import time
while True:
    try:
        r = redis.Redis(host='redis', port=6379, db=0)
        r.ping()
        print('✅ Redis está pronto!')
        break
    except:
        time.sleep(2)
"
}

# Aguardar serviços estarem prontos
wait_for_postgres
wait_for_redis

# Executar script de inicialização do banco
echo "🔧 Executando inicialização do banco de dados..."
python scripts/init_saas.py

# Iniciar a aplicação
echo "🚀 Iniciando aplicação FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 