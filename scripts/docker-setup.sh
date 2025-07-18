#!/bin/bash

# Script para setup do ambiente Docker
echo "🚀 Configurando ambiente Docker para FinanceMax..."

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verifica se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# Cria arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Configurações do Banco de Dados
POSTGRES_DB=finwise_db
POSTGRES_USER=finwise_user
POSTGRES_PASSWORD=finwise_password

# Configurações do Backend
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configurações do Frontend
VITE_API_URL=http://localhost:8000

# Configurações do Ambiente
NODE_ENV=production
PYTHON_ENV=production
EOF
    echo "✅ Arquivo .env criado"
fi

# Constrói e inicia os containers
echo "🔨 Construindo containers..."
docker-compose build

echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguarda os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verifica status dos containers
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📱 Acesse a aplicação em:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:8000"
echo "   Nginx (proxy): http://localhost:80"
echo ""
echo "📋 Comandos úteis:"
echo "   docker-compose logs -f          # Ver logs em tempo real"
echo "   docker-compose down             # Parar todos os serviços"
echo "   docker-compose restart backend  # Reiniciar apenas o backend"
echo "   docker-compose restart frontend # Reiniciar apenas o frontend"
echo "" 