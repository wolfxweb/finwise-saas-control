#!/usr/bin/env python3
"""
Script para listar todos os usuários cadastrados no banco de dados
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.abspath('backend'))

from app.models.user import User
from app.models.company import Company
from app.core.config import settings

def list_users():
    """Lista todos os usuários cadastrados no banco de dados"""
    
    try:
        # Criar engine do banco de dados
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Criar sessão
        db = SessionLocal()
        
        # Buscar todos os usuários com informações da empresa
        users = db.query(User).join(Company).all()
        
        if not users:
            print("Nenhum usuário encontrado no banco de dados.")
            return
        
        print(f"\n{'='*80}")
        print(f"LISTAGEM DE USUÁRIOS CADASTRADOS")
        print(f"{'='*80}")
        print(f"Total de usuários: {len(users)}")
        print(f"{'='*80}")
        
        for i, user in enumerate(users, 1):
            print(f"\n{i}. USUÁRIO:")
            print(f"   ID: {user.id}")
            print(f"   Nome: {user.first_name} {user.last_name}")
            print(f"   Email: {user.email}")
            print(f"   Empresa: {user.company.name if user.company else 'N/A'}")
            print(f"   Cargo: {user.role}")
            print(f"   Status: {user.status}")
            print(f"   Último login: {user.last_login.strftime('%d/%m/%Y %H:%M:%S') if user.last_login else 'Nunca'}")
            print(f"   Criado em: {user.created_at.strftime('%d/%m/%Y %H:%M:%S')}")
            print(f"   Atualizado em: {user.updated_at.strftime('%d/%m/%Y %H:%M:%S') if user.updated_at else 'N/A'}")
            print(f"   {'-'*50}")
        
        print(f"\n{'='*80}")
        print("LISTAGEM CONCLUÍDA")
        print(f"{'='*80}")
        
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        print("\nVerifique se:")
        print("1. O banco de dados está rodando")
        print("2. A variável DATABASE_URL está configurada corretamente")
        print("3. As credenciais do banco estão corretas")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    list_users() 