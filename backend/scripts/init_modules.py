#!/usr/bin/env python3
"""
Script para inicializar módulos padrão no sistema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.plan import Module
from app.schemas.module import ModuleCreate
from app.services.module_service import ModuleService

def init_modules():
    """Inicializar módulos padrão"""
    db = SessionLocal()
    
    try:
        # Verificar se já existem módulos
        existing_modules = db.query(Module).count()
        if existing_modules > 0:
            print("Módulos já existem no sistema. Pulando inicialização.")
            return
        
        # Módulos padrão
        default_modules = [
            {
                "name": "Gestão Financeira",
                "code": "FINANCEIRO",
                "description": "Módulo completo para gestão financeira incluindo contas a pagar, receber, fluxo de caixa e centro de custos",
                "price": 50.00,
                "category": "Financeiro"
            },
            {
                "name": "Gestão de Estoque",
                "code": "ESTOQUE",
                "description": "Controle completo de estoque com entrada, saída, inventário e relatórios",
                "price": 40.00,
                "category": "Operacional"
            },
            {
                "name": "Gestão de Vendas",
                "code": "VENDAS",
                "description": "Sistema de vendas com pedidos, orçamentos e controle de clientes",
                "price": 45.00,
                "category": "Comercial"
            },
            {
                "name": "Gestão de Compras",
                "code": "COMPRAS",
                "description": "Controle de compras, fornecedores e cotações",
                "price": 35.00,
                "category": "Operacional"
            },
            {
                "name": "Gestão de Fornecedores",
                "code": "FORNECEDORES",
                "description": "Cadastro e gestão completa de fornecedores",
                "price": 25.00,
                "category": "Operacional"
            },
            {
                "name": "Gestão de Usuários",
                "code": "USUARIOS",
                "description": "Controle de usuários, perfis e permissões",
                "price": 20.00,
                "category": "Administrativo"
            },
            {
                "name": "Relatórios Avançados",
                "code": "RELATORIOS",
                "description": "Relatórios personalizados e dashboards",
                "price": 30.00,
                "category": "Analítico"
            },
            {
                "name": "Nota Fiscal Eletrônica",
                "code": "NFE",
                "description": "Emissão e gestão de notas fiscais eletrônicas",
                "price": 60.00,
                "category": "Fiscal"
            },
            {
                "name": "Atendimento ao Cliente",
                "code": "ATENDIMENTO",
                "description": "Sistema de atendimento e suporte ao cliente",
                "price": 35.00,
                "category": "Comercial"
            },
            {
                "name": "Expedição e Logística",
                "code": "EXPEDICAO",
                "description": "Controle de expedição, rastreamento e logística",
                "price": 40.00,
                "category": "Operacional"
            }
        ]
        
        # Criar módulos
        for module_data in default_modules:
            try:
                module = ModuleService.create_module(db, ModuleCreate(**module_data))
                print(f"✅ Módulo criado: {module.name} ({module.code})")
            except Exception as e:
                print(f"❌ Erro ao criar módulo {module_data['name']}: {str(e)}")
        
        print(f"\n🎉 Inicialização concluída! {len(default_modules)} módulos criados.")
        
    except Exception as e:
        print(f"❌ Erro durante inicialização: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    init_modules() 