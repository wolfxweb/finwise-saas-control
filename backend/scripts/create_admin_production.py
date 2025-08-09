#!/usr/bin/env python3
"""
Script para criar usuário administrador em produção
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.core.security import get_password_hash
import uuid

def create_production_admin():
    """Criar usuário administrador para produção"""
    print("🔐 Criando usuário administrador para produção...")
    db = SessionLocal()
    
    try:
        # Buscar empresa admin
        admin_company = db.query(Company).filter(Company.cnpj == "00.000.000/0001-00").first()
        
        if not admin_company:
            print("❌ Empresa administradora não encontrada!")
            print("Execute primeiro: python scripts/init_saas.py")
            return False
        
        # Verificar se já existe
        admin_user = db.query(User).filter(User.email == "wolfxweb@gmail.com").first()
        if admin_user:
            print("⚠️  Usuário wolfxweb@gmail.com já existe")
            print("🔑 Atualizando senha para: wolfx2020")
            
            # Atualizar senha
            admin_user.password_hash = get_password_hash("wolfx2020")
            admin_user.first_name = "WolfX"
            admin_user.last_name = "Admin"
            admin_user.role = "admin"
            admin_user.status = "active"
            db.commit()
            
            print("✅ Senha e dados atualizados com sucesso!")
            return True
        
        # Criar novo usuário
        admin_user = User(
            email="wolfxweb@gmail.com",
            password_hash=get_password_hash("wolfx2020"),
            first_name="WolfX",
            last_name="Admin",
            role="admin",
            company_id=admin_company.id,
            status="active"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuário administrador de produção criado!")
        print("📧 Email: wolfxweb@gmail.com")
        print("🔑 Senha: wolfx2020")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    create_production_admin() 