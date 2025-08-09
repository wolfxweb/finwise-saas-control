#!/usr/bin/env python3
"""
Script de inicialização para produção
Cria todas as tabelas e inicializa dados básicos de forma segura
"""

import sys
import os
import time

# Adicionar o diretório pai ao path para importar módulos da aplicação
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
        from app.models.plan import Plan, Module, CompanyModule, PlanModule, CompanySubscription
        from app.models.supplier import Supplier
        from app.models.customer import Customer
        from app.models.product import Product
        from app.models.product_sku import ProductSKU
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
        from app.models.billing import Invoice, InvoiceItem, Payment, BillingSettings
        
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
        existing_tables = check_existing_tables()
        
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        
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

def create_initial_modules():
    """Criar módulos iniciais do sistema"""
    logger.info("Criando módulos iniciais...")
    db = SessionLocal()
    
    try:
        from app.models.plan import Module
        
        modules_data = [
            {"name": "Fluxo de Caixa", "description": "Controle completo de entrada e saída de recursos financeiros"},
            {"name": "Contas a Receber", "description": "Gestão de valores a receber de clientes"},
            {"name": "Contas a Pagar", "description": "Controle de contas e compromissos a pagar"},
            {"name": "Centro de Custos", "description": "Organização e controle de centros de custos"},
            {"name": "Produtos", "description": "Cadastro e gestão completa de produtos"},
            {"name": "Gestão de Estoque", "description": "Controle de movimentação e saldo de estoque"},
            {"name": "Fornecedores", "description": "Cadastro e gestão de fornecedores"},
            {"name": "Compras", "description": "Gestão do processo de compras"},
            {"name": "Expedição", "description": "Controle de expedição e envios"},
            {"name": "Pedidos", "description": "Gestão de pedidos de venda"},
            {"name": "Marketplace", "description": "Integração com marketplaces"},
            {"name": "Nota Fiscal", "description": "Emissão e controle de notas fiscais"},
            {"name": "Usuários", "description": "Gestão de usuários do sistema"},
            {"name": "Atendimento", "description": "Sistema de atendimento ao cliente"},
        ]
        
        for module_data in modules_data:
            existing_module = db.query(Module).filter(Module.name == module_data["name"]).first()
            if not existing_module:
                module = Module(**module_data)
                db.add(module)
                logger.info(f"  ✅ Módulo '{module_data['name']}' criado")
            else:
                logger.info(f"  ⚠️  Módulo '{module_data['name']}' já existe")
        
        db.commit()
        logger.info("✅ Módulos criados com sucesso!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar módulos: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_initial_plans():
    """Criar planos iniciais do sistema"""
    logger.info("Criando planos iniciais...")
    db = SessionLocal()
    
    try:
        from app.models.plan import Plan, Module, PlanModule
        
        plans_data = [
            {
                "name": "Básico",
                "description": "Plano básico com funcionalidades essenciais",
                "price": 49.90,
                "max_users": 3,
                "max_branches": 1,
                "modules": ["Fluxo de Caixa", "Contas a Receber", "Contas a Pagar"]
            },
            {
                "name": "Profissional", 
                "description": "Plano profissional com mais recursos",
                "price": 99.90,
                "max_users": 10,
                "max_branches": 3,
                "modules": ["Fluxo de Caixa", "Contas a Receber", "Contas a Pagar", "Produtos", "Gestão de Estoque", "Fornecedores"]
            },
            {
                "name": "Empresarial",
                "description": "Plano completo para empresas",
                "price": 199.90,
                "max_users": -1,  # Ilimitado
                "max_branches": -1,  # Ilimitado
                "modules": ["Fluxo de Caixa", "Contas a Receber", "Contas a Pagar", "Centro de Custos", "Produtos", "Gestão de Estoque", "Fornecedores", "Compras", "Expedição", "Pedidos", "Marketplace", "Nota Fiscal", "Usuários", "Atendimento"]
            }
        ]
        
        for plan_data in plans_data:
            existing_plan = db.query(Plan).filter(Plan.name == plan_data["name"]).first()
            if not existing_plan:
                # Criar plano
                plan = Plan(
                    name=plan_data["name"],
                    description=plan_data["description"],
                    price=plan_data["price"],
                    max_users=plan_data["max_users"],
                    max_branches=plan_data["max_branches"]
                )
                db.add(plan)
                db.commit()
                db.refresh(plan)
                
                # Associar módulos ao plano
                for module_name in plan_data["modules"]:
                    module = db.query(Module).filter(Module.name == module_name).first()
                    if module:
                        plan_module = PlanModule(plan_id=plan.id, module_id=module.id)
                        db.add(plan_module)
                
                db.commit()
                logger.info(f"  ✅ Plano '{plan_data['name']}' criado")
            else:
                logger.info(f"  ⚠️  Plano '{plan_data['name']}' já existe")
        
        logger.info("✅ Planos criados com sucesso!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar planos: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_master_company():
    """Criar empresa master do sistema"""
    logger.info("Criando empresa master...")
    db = SessionLocal()
    
    try:
        from app.models.company import Company
        from app.models.plan import Plan, Module, CompanyModule
        
        # Verificar se já existe
        master_company = db.query(Company).filter(Company.cnpj == "00.000.000/0001-00").first()
        if master_company:
            logger.info("⚠️  Empresa master já existe")
            logger.info(f"🏢 ID da empresa master: {master_company.id}")
            return master_company.id, str(master_company.id)
        
        # Criar empresa master
        master_company = Company(
            name="FinanceMax System",
            corporate_name="FinanceMax System Ltda",
            cnpj="00.000.000/0001-00",
            email="admin@financemax.com",
            phone="(11) 99999-9999",
            address="Rua do Sistema, 123",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            status="active",
            plan_type="enterprise"
        )
        
        db.add(master_company)
        db.commit()
        db.refresh(master_company)
        
        # Associar todos os módulos à empresa master
        modules = db.query(Module).all()
        for module in modules:
            company_module = CompanyModule(
                company_id=master_company.id,
                module_id=module.id
            )
            db.add(company_module)
        
        db.commit()
        
        logger.info(f"✅ Empresa master criada: {master_company.name}")
        logger.info(f"🏢 ID da empresa master: {master_company.id}")
        return master_company.id, str(master_company.id)
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar empresa master: {e}")
        db.rollback()
        return None, None
    finally:
        db.close()

def create_master_admin(company_id, company_id_str):
    """Criar usuário administrador master"""
    logger.info("🔐 Criando usuário administrador master...")
    db = SessionLocal()
    
    try:
        from app.models.user import User
        from app.core.security import get_password_hash
        
        # Verificar se já existe o usuário master
        master_user = db.query(User).filter(User.email == "wolfxweb@gmail.com").first()
        if master_user:
            logger.info("⚠️  Usuário master wolfxweb@gmail.com já existe")
            logger.info("🔑 Atualizando senha e privilégios...")
            
            # Atualizar dados do usuário
            master_user.password_hash = get_password_hash("wolfx2020")
            master_user.first_name = "WolfX"
            master_user.last_name = "Master Admin"
            master_user.role = "admin"
            master_user.company_id = company_id
            master_user.status = "active"
            db.commit()
            
            logger.info("✅ Usuário master atualizado com sucesso!")
        else:
            # Criar novo usuário master
            master_user = User(
                email="wolfxweb@gmail.com",
                password_hash=get_password_hash("wolfx2020"),
                first_name="WolfX",
                last_name="Master Admin",
                role="admin",
                company_id=company_id,
                status="active"
            )
            
            db.add(master_user)
            db.commit()
            db.refresh(master_user)
            
            logger.info("✅ Usuário master criado com sucesso!")
        
        logger.info("=" * 60)
        logger.info("🎉 CONFIGURAÇÃO MASTER CONCLUÍDA!")
        logger.info("=" * 60)
        logger.info(f"🏢 Empresa Master ID: {company_id_str}")
        logger.info(f"📧 Login Master: wolfxweb@gmail.com")
        logger.info(f"🔑 Senha Master: wolfx2020")
        logger.info(f"👤 Nome: WolfX Master Admin")
        logger.info(f"🎯 Role: admin (Acesso total ao painel master)")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar usuário master: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def init_basic_data():
    """Inicializa dados básicos para produção"""
    logger.info("🚀 Inicializando dados básicos para produção...")
    
    try:
        # 1. Criar módulos do sistema
        if not create_initial_modules():
            logger.error("Falha ao criar módulos")
            return False
        
        # 2. Criar planos do sistema
        if not create_initial_plans():
            logger.error("Falha ao criar planos")
            return False
        
        # 3. Criar empresa master
        company_id, company_id_str = create_master_company()
        if not company_id:
            logger.error("Falha ao criar empresa master")
            return False
        
        # 4. Criar usuário master admin
        if not create_master_admin(company_id, company_id_str):
            logger.error("Falha ao criar usuário master")
            return False
        
        logger.info("✅ Dados básicos inicializados com sucesso!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar dados básicos: {e}")
        return False

def main():
    """Função principal"""
    logger.info("🚀 Iniciando configuração completa para produção...")
    logger.info("=" * 60)
    
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
    
    # Passo 4: Inicializar dados completos
    if not init_basic_data():
        logger.error("❌ Falha ao inicializar dados!")
        sys.exit(1)
    
    logger.info("=" * 60)
    logger.info("🎉 SISTEMA PRONTO PARA PRODUÇÃO!")
    logger.info("=" * 60)
    logger.info("🌐 Acesse o painel master em: /admin/login")
    logger.info("📧 Email: wolfxweb@gmail.com")
    logger.info("🔑 Senha: wolfx2020")
    logger.info("=" * 60)
    
    return True

if __name__ == "__main__":
    main() 