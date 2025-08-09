-- Script de inicialização do banco PostgreSQL para produção
-- Este script garante que o usuário e banco sejam criados corretamente

-- Definir configurações de autenticação
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Log de início
SELECT 'Iniciando configuração do banco de dados PostgreSQL...' as status;

-- Criar o usuário se não existir
DO $$
DECLARE
    user_exists boolean;
    db_exists boolean;
BEGIN
    -- Verificar se o usuário existe
    SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'finwise_user') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Criar usuário com privilégios necessários
        EXECUTE 'CREATE USER finwise_user WITH PASSWORD ''finwise_password''';
        EXECUTE 'ALTER USER finwise_user CREATEDB';
        EXECUTE 'ALTER USER finwise_user WITH REPLICATION';
        
        RAISE NOTICE 'Usuário finwise_user criado com sucesso';
    ELSE
        -- Garantir que o usuário tenha a senha correta e privilégios
        EXECUTE 'ALTER USER finwise_user WITH PASSWORD ''finwise_password''';
        EXECUTE 'ALTER USER finwise_user CREATEDB';
        EXECUTE 'ALTER USER finwise_user WITH REPLICATION';
        
        RAISE NOTICE 'Usuário finwise_user já existe - credenciais e privilégios atualizados';
    END IF;
    
    -- Verificar se o banco existe
    SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'finwise_saas_db') INTO db_exists;
    
    IF NOT db_exists THEN
        -- Criar banco de dados
        EXECUTE 'CREATE DATABASE finwise_saas_db OWNER finwise_user';
        RAISE NOTICE 'Banco finwise_saas_db criado com sucesso';
    ELSE
        -- Garantir que o usuário seja owner do banco
        EXECUTE 'ALTER DATABASE finwise_saas_db OWNER TO finwise_user';
        RAISE NOTICE 'Banco finwise_saas_db já existe - ownership atualizado';
    END IF;
    
END
$$;

-- Conectar ao banco finwise_saas_db
\c finwise_saas_db;

-- Garantir todas as permissões no schema public
GRANT ALL ON SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finwise_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO finwise_user;

-- Definir permissões padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO finwise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO finwise_user;

-- Configurar parâmetros do banco para melhor performance
ALTER DATABASE finwise_saas_db SET timezone TO 'UTC';
ALTER DATABASE finwise_saas_db SET default_transaction_isolation TO 'read committed';
ALTER DATABASE finwise_saas_db SET client_encoding TO 'utf8';

-- Log de sucesso
SELECT 'Banco de dados inicializado com sucesso para finwise_user' as status;
SELECT 'Usuário: finwise_user | Banco: finwise_saas_db | Status: PRONTO' as configuracao; 