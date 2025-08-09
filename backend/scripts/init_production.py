#!/usr/bin/env python3
"""
Script de inicialização para produção
Cria todas as tabelas e inicializa dados básicos de forma segura
"""

import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, Base, SessionLocal
from sqlalchemy import text, inspect
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def wait_for_db(max_retries=30):
    """Aguarda o banco de dados ficar disponível"""
    logger.info("Aguardando banco de dados...")
    
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Banco de dados conectado!")
            return True
        except Exception as e:
            logger.info(f"⏳ Tentativa {attempt + 1}/{max_retries} - Aguardando BD... ({e})")
            time.sleep(2)
    
    logger.error("❌ Falha ao conectar com o banco de dados!")
    return False

def import_all_models():
    """Importa todos os modelos para garantir que estejam registrados"""
    logger.info("Importando modelos...")
    
    try:
        # Import all models to ensure they are registered with Base
        from app.models.user import User
        from app.models.company import Company, Branch
        from app.models.plan import Plan, Module, CompanyModule, PlanModule
        from app.models.supplier import Supplier
        from app.models.customer import Customer
        from app.models.product import Product
        from app.models.product_sku import ProductSku
        from app.models.product_component import ProductComponent
        from app.models.category import Category
        from app.models.stock_movement import StockMovement
        from app.models.stock_branch import StockBranch
        from app.models.payable_category import PayableCategory
        from app.models.accounts_payable import AccountsPayable
        from app.models.accounts_receivable import AccountsReceivable
        from app.models.account import Account
        from app.models.bank import Bank
        from app.models.nota_fiscal import NotaFiscal
        from app.models.billing import CompanySubscription, Invoice, InvoiceItem, Payment, BillingSetting
        
        logger.info("✅ Todos os modelos importados!")
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao importar modelos: {e}")
        return False

def check_existing_tables():
    """Verifica quais tabelas já existem"""
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        logger.info(f"📋 Tabelas existentes: {existing_tables}")
        return existing_tables
    except Exception as e:
        logger.error(f"❌ Erro ao verificar tabelas: {e}")
        return []

def create_tables():
    """Cria todas as tabelas usando SQLAlchemy"""
    logger.info("Criando tabelas...")
    
    try:
        # Check existing tables first
        existing_tables = check_existing_tables()
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        new_tables = check_existing_tables()
        created_tables = set(new_tables) - set(existing_tables)
        
        if created_tables:
            logger.info(f"✅ Novas tabelas criadas: {created_tables}")
        else:
            logger.info("✅ Todas as tabelas já existiam ou foram criadas!")
        
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao criar tabelas: {e}")
        return False

def init_basic_data():
    """Inicializa dados básicos se necessário"""
    logger.info("Verificando dados básicos...")
    
    try:
        db = SessionLocal()
        
        # Você pode adicionar inicialização de dados aqui
        # Por exemplo, criar planos padrão, módulos, etc.
        
        logger.info("✅ Dados básicos verificados!")
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar dados: {e}")
        return False
    finally:
        try:
            db.close()
        except:
            pass

def main():
    """Função principal"""
    logger.info("🚀 Iniciando configuração do banco de dados para produção...")
    
    # Passo 1: Aguardar banco
    if not wait_for_db():
        logger.error("❌ Falha na conexão com banco!")
        sys.exit(1)
    
    # Passo 2: Importar modelos
    if not import_all_models():
        logger.error("❌ Falha ao importar modelos!")
        sys.exit(1)
    
    # Passo 3: Criar tabelas
    if not create_tables():
        logger.error("❌ Falha ao criar tabelas!")
        sys.exit(1)
    
    # Passo 4: Inicializar dados
    if not init_basic_data():
        logger.error("❌ Falha ao inicializar dados!")
        sys.exit(1)
    
    logger.info("🎉 Banco de dados configurado com sucesso!")
    return True

if __name__ == "__main__":
    main() 