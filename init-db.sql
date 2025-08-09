-- Script de inicialização do banco PostgreSQL para produção
-- Este script garante que o usuário e banco sejam criados corretamente

-- Criar o usuário se não existir (com fallback)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'finwise_user') THEN
        CREATE USER finwise_user WITH PASSWORD 'finwise_password';
        ALTER USER finwise_user CREATEDB;
        GRANT ALL PRIVILEGES ON DATABASE finwise_saas_db TO finwise_user;
        
        RAISE NOTICE 'Usuário finwise_user criado com sucesso';
    ELSE
        -- Garantir que o usuário tenha a senha correta
        ALTER USER finwise_user WITH PASSWORD 'finwise_password';
        GRANT ALL PRIVILEGES ON DATABASE finwise_saas_db TO finwise_user;
        
        RAISE NOTICE 'Usuário finwise_user já existe - permissões atualizadas';
    END IF;
END
$$;

-- Garantir que o banco existe
SELECT 'CREATE DATABASE finwise_saas_db OWNER finwise_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'finwise_saas_db')\gexec

-- Conectar ao banco e conceder permissões
\c finwise_saas_db;

-- Garantir todas as permissões no schema public
GRANT ALL ON SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO finwise_user;

-- Log de sucesso
SELECT 'Banco de dados inicializado com sucesso para finwise_user' as status; 