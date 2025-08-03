#!/usr/bin/env python3
"""
Script simplificado para listar todos os usuários cadastrados no banco de dados
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

def list_users():
    """Lista todos os usuários cadastrados no banco de dados"""
    
    # Configuração do banco de dados
    DATABASE_URL = "postgresql://finwise_user:finwise_password@postgres:5432/finwise_saas_db"
    
    try:
        # Criar engine do banco de dados
        engine = create_engine(DATABASE_URL)
        
        # Testar conexão
        with engine.connect() as conn:
            # Query SQL direta para buscar usuários
            query = text("""
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.role,
                    u.status,
                    u.last_login,
                    u.created_at,
                    u.updated_at,
                    c.name as company_name
                FROM users u
                LEFT JOIN companies c ON u.company_id = c.id
                ORDER BY u.created_at DESC
            """)
            
            result = conn.execute(query)
            users = result.fetchall()
            
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
                print(f"   Empresa: {user.company_name or 'N/A'}")
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

if __name__ == "__main__":
    list_users() 