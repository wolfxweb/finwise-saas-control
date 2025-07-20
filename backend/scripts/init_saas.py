#!/usr/bin/env python3
"""
Script de inicialização do sistema SaaS FinanceMax
Cria as tabelas e insere dados iniciais
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.company import Company, Branch
from app.models.user import User, Permission
from app.models.plan import Plan, Module, PlanModule
from app.core.security import get_password_hash
from datetime import date
import uuid

def create_tables():
    """Criar todas as tabelas"""
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas com sucesso!")

def create_initial_modules():
    """Criar módulos iniciais do sistema"""
    print("Criando módulos iniciais...")
    db = SessionLocal()
    
    modules_data = [
        {
            "name": "Fluxo de Caixa",
            "code": "cash_flow",
            "description": "Controle de fluxo de caixa e movimentações financeiras",
            "price": 79.00,
            "category": "finance"
        },
        {
            "name": "Contas a Receber",
            "code": "accounts_receivable",
            "description": "Gestão de contas a receber e recebimentos",
            "price": 59.00,
            "category": "finance"
        },
        {
            "name": "Contas a Pagar",
            "code": "accounts_payable",
            "description": "Gestão de contas a pagar e pagamentos",
            "price": 59.00,
            "category": "finance"
        },
        {
            "name": "Centro de Custos",
            "code": "cost_center",
            "description": "Controle de centros de custos e despesas",
            "price": 49.00,
            "category": "finance"
        },
        {
            "name": "Produtos",
            "code": "products",
            "description": "Cadastro e gestão de produtos",
            "price": 39.00,
            "category": "inventory"
        },
        {
            "name": "Gestão de Estoque",
            "code": "inventory",
            "description": "Controle de estoque e movimentações",
            "price": 49.00,
            "category": "inventory"
        },
        {
            "name": "Fornecedores",
            "code": "suppliers",
            "description": "Cadastro e gestão de fornecedores",
            "price": 29.00,
            "category": "supply_chain"
        },
        {
            "name": "Compras",
            "code": "purchases",
            "description": "Gestão de compras e pedidos",
            "price": 39.00,
            "category": "supply_chain"
        },
        {
            "name": "Expedição",
            "code": "shipping",
            "description": "Controle de expedição e logística",
            "price": 39.00,
            "category": "supply_chain"
        },
        {
            "name": "Pedidos",
            "code": "orders",
            "description": "Gestão de pedidos de venda",
            "price": 49.00,
            "category": "sales"
        },
        {
            "name": "Marketplace",
            "code": "marketplace",
            "description": "Integração com marketplaces",
            "price": 69.00,
            "category": "sales"
        },
        {
            "name": "Nota Fiscal",
            "code": "invoice",
            "description": "Emissão e gestão de notas fiscais",
            "price": 39.00,
            "category": "sales"
        },
        {
            "name": "Usuários",
            "code": "users",
            "description": "Gestão de usuários e permissões",
            "price": 19.00,
            "category": "management"
        },
        {
            "name": "Atendimento",
            "code": "support",
            "description": "Sistema de atendimento ao cliente",
            "price": 29.00,
            "category": "management"
        }
    ]
    
    for module_data in modules_data:
        existing_module = db.query(Module).filter(Module.code == module_data["code"]).first()
        if not existing_module:
            module = Module(**module_data)
            db.add(module)
            print(f"  ✅ Módulo '{module_data['name']}' criado")
    
    db.commit()
    print("✅ Módulos criados com sucesso!")
    db.close()

def create_initial_plans():
    """Criar planos iniciais"""
    print("Criando planos iniciais...")
    db = SessionLocal()
    
    plans_data = [
        {
            "name": "Básico",
            "description": "Plano básico para pequenas empresas",
            "price": 99.00,
            "billing_cycle": "monthly",
            "max_users": 3,
            "max_branches": 1
        },
        {
            "name": "Profissional",
            "description": "Plano profissional para empresas em crescimento",
            "price": 199.00,
            "billing_cycle": "monthly",
            "max_users": 10,
            "max_branches": 3
        },
        {
            "name": "Empresarial",
            "description": "Plano empresarial para grandes empresas",
            "price": 399.00,
            "billing_cycle": "monthly",
            "max_users": 50,
            "max_branches": 10
        }
    ]
    
    for plan_data in plans_data:
        existing_plan = db.query(Plan).filter(Plan.name == plan_data["name"]).first()
        if not existing_plan:
            plan = Plan(**plan_data)
            db.add(plan)
            db.commit()
            db.refresh(plan)
            print(f"  ✅ Plano '{plan_data['name']}' criado")
    
    print("✅ Planos criados com sucesso!")
    db.close()

def create_admin_company():
    """Criar empresa administradora do sistema"""
    print("Criando empresa administradora...")
    db = SessionLocal()
    
    # Verificar se já existe
    admin_company = db.query(Company).filter(Company.cnpj == "00.000.000/0001-00").first()
    if admin_company:
        print("  ⚠️  Empresa administradora já existe")
        db.close()
        return admin_company.id
    
    # Criar empresa administradora
    admin_company = Company(
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
    
    db.add(admin_company)
    db.commit()
    db.refresh(admin_company)
    
    print(f"  ✅ Empresa administradora criada: {admin_company.name}")
    db.close()
    return admin_company.id

def create_admin_user(company_id: uuid.UUID):
    """Criar usuário administrador"""
    print("Criando usuário administrador...")
    db = SessionLocal()
    
    # Verificar se já existe
    admin_user = db.query(User).filter(User.email == "admin@financemax.com").first()
    if admin_user:
        print("  ⚠️  Usuário administrador já existe")
        db.close()
        return
    
    # Criar usuário administrador
    admin_user = User(
        email="admin@financemax.com",
        password_hash=get_password_hash("admin123"),
        first_name="Administrador",
        last_name="Sistema",
        role="admin",
        company_id=company_id,
        status="active"
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"  ✅ Usuário administrador criado: {admin_user.email}")
    print("  🔑 Senha: admin123")
    db.close()

def create_initial_permissions():
    """Criar permissões iniciais"""
    print("Criando permissões iniciais...")
    db = SessionLocal()
    
    # Obter módulos
    modules = db.query(Module).all()
    
    permissions_data = []
    for module in modules:
        permissions_data.extend([
            {
                "name": f"Visualizar {module.name}",
                "code": f"{module.code}:read",
                "module_id": module.id,
                "description": f"Permissão para visualizar {module.name}"
            },
            {
                "name": f"Editar {module.name}",
                "code": f"{module.code}:write",
                "module_id": module.id,
                "description": f"Permissão para editar {module.name}"
            },
            {
                "name": f"Excluir {module.name}",
                "code": f"{module.code}:delete",
                "module_id": module.id,
                "description": f"Permissão para excluir {module.name}"
            }
        ])
    
    for permission_data in permissions_data:
        existing_permission = db.query(Permission).filter(Permission.code == permission_data["code"]).first()
        if not existing_permission:
            permission = Permission(**permission_data)
            db.add(permission)
    
    db.commit()
    print("✅ Permissões criadas com sucesso!")
    db.close()

def main():
    """Função principal"""
    print("🚀 Inicializando sistema SaaS FinanceMax...")
    print("=" * 50)
    
    try:
        # Criar tabelas
        create_tables()
        
        # Criar módulos
        create_initial_modules()
        
        # Criar planos
        create_initial_plans()
        
        # Criar empresa administradora
        admin_company_id = create_admin_company()
        
        # Criar usuário administrador
        create_admin_user(admin_company_id)
        
        # Criar permissões
        create_initial_permissions()
        
        print("=" * 50)
        print("✅ Sistema SaaS FinanceMax inicializado com sucesso!")
        print("📧 Login: admin@financemax.com")
        print("🔑 Senha: admin123")
        print("🌐 Acesse: http://localhost:8080")
        
    except Exception as e:
        print(f"❌ Erro durante a inicialização: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 