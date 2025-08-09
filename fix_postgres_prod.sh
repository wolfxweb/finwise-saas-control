#!/bin/bash

echo "🔧 Script para Corrigir PostgreSQL em Produção"
echo "=============================================="

# Encontrar o container PostgreSQL
POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -i postgres | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Container PostgreSQL não encontrado!"
    echo "📋 Containers disponíveis:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo "🐘 Container PostgreSQL encontrado: $POSTGRES_CONTAINER"

# Senha do PostgreSQL (ajuste conforme necessário)
POSTGRES_PASSWORD="SuaSenhaPostgresMuitoSegura123!"
echo "🔑 Usando senha: $POSTGRES_PASSWORD"

echo ""
echo "🔧 Criando usuário e banco PostgreSQL..."

# Executar comandos SQL no PostgreSQL
docker exec -i $POSTGRES_CONTAINER psql -U postgres << EOF
-- Remover usuário se existir (para recriação limpa)
DROP USER IF EXISTS finwise_user;

-- Criar usuário
CREATE USER finwise_user WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER finwise_user CREATEDB;
ALTER USER finwise_user WITH REPLICATION;

-- Remover banco se existir
DROP DATABASE IF EXISTS finwise_saas_db;

-- Criar banco
CREATE DATABASE finwise_saas_db OWNER finwise_user;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE finwise_saas_db TO finwise_user;

\echo '✅ Usuário e banco criados!'
EOF

echo ""
echo "🔐 Configurando permissões no banco..."

# Configurar permissões no banco específico
docker exec -i $POSTGRES_CONTAINER psql -U finwise_user -d finwise_saas_db << EOF
-- Configurar permissões no schema public
GRANT ALL ON SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO finwise_user;

-- Configurar permissões padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO finwise_user;

-- Configurar parâmetros do banco
ALTER DATABASE finwise_saas_db SET timezone TO 'UTC';
ALTER DATABASE finwise_saas_db SET default_transaction_isolation TO 'read committed';
ALTER DATABASE finwise_saas_db SET client_encoding TO 'utf8';

\echo '✅ Permissões configuradas!'
EOF

echo ""
echo "🧪 Testando conexão..."

# Testar conexão
TEST_RESULT=$(docker exec $POSTGRES_CONTAINER psql -U finwise_user -d finwise_saas_db -t -c "SELECT 'CONEXAO_OK' as status;" 2>/dev/null)

if [[ $TEST_RESULT == *"CONEXAO_OK"* ]]; then
    echo "✅ Teste de conexão: SUCESSO!"
else
    echo "❌ Teste de conexão: FALHOU!"
    echo "🔍 Verificando usuários existentes:"
    docker exec $POSTGRES_CONTAINER psql -U postgres -c "\du"
    exit 1
fi

echo ""
echo "🔄 Encontrando e reiniciando container backend..."

# Encontrar container backend
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -i backend | head -1)

if [ -n "$BACKEND_CONTAINER" ]; then
    echo "🔄 Reiniciando container backend: $BACKEND_CONTAINER"
    docker restart $BACKEND_CONTAINER
    echo "✅ Backend reiniciado!"
else
    echo "⚠️  Container backend não encontrado. Reinicie manualmente."
fi

echo ""
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo "=============================================="
echo "📊 Resumo:"
echo "   🐘 PostgreSQL: $POSTGRES_CONTAINER"
echo "   👤 Usuário: finwise_user"
echo "   🗃️  Banco: finwise_saas_db"
echo "   🔑 Senha: $POSTGRES_PASSWORD"
echo ""
echo "🚀 O backend deve conectar automaticamente agora!"
echo "📋 Para verificar logs: docker logs $BACKEND_CONTAINER" 