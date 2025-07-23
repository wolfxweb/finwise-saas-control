#!/usr/bin/env python3
"""
Script para criar fornecedores de teste para a empresa Maria
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.supplier import Supplier
import uuid

def create_test_suppliers():
    """Criar fornecedores de teste para a empresa Maria"""
    print("🔧 Criando fornecedores de teste para a empresa Maria...")
    db = SessionLocal()
    
    # ID da empresa Maria
    maria_company_id = "f3d690d5-deab-4b36-b42f-a7204845444a"
    
    # Dados dos fornecedores de teste
    test_suppliers = [
        {
            "name": "Fornecedor ABC Ltda",
            "corporate_name": "ABC Comércio e Distribuição Ltda",
            "cnpj": "12.345.678/0001-90",
            "email": "contato@abc.com.br",
            "phone": "(11) 3333-4444",
            "address": "Rua das Flores, 123",
            "city": "São Paulo",
            "state": "SP",
            "category": "Distribuidor",
            "status": "ativo",
            "rating": 4.5
        },
        {
            "name": "Indústria XYZ",
            "corporate_name": "XYZ Indústria e Comércio S.A.",
            "cnpj": "98.765.432/0001-10",
            "email": "vendas@xyz.com.br",
            "phone": "(11) 5555-6666",
            "address": "Av. Industrial, 456",
            "city": "São Paulo",
            "state": "SP",
            "category": "Fabricante",
            "status": "ativo",
            "rating": 4.8
        },
        {
            "name": "Comercial Delta",
            "corporate_name": "Delta Comercial Ltda",
            "cnpj": "11.222.333/0001-44",
            "email": "delta@comercial.com.br",
            "phone": "(11) 7777-8888",
            "address": "Rua do Comércio, 789",
            "city": "São Paulo",
            "state": "SP",
            "category": "Atacadista",
            "status": "ativo",
            "rating": 4.2
        },
        {
            "name": "Importadora Global",
            "corporate_name": "Global Importação e Exportação Ltda",
            "cnpj": "55.666.777/0001-88",
            "email": "global@import.com.br",
            "phone": "(11) 9999-0000",
            "address": "Av. Internacional, 321",
            "city": "São Paulo",
            "state": "SP",
            "category": "Importador",
            "status": "ativo",
            "rating": 4.7
        },
        {
            "name": "Prestador de Serviços",
            "corporate_name": "Serviços Especializados Ltda",
            "cpf": "123.456.789-00",
            "email": "servicos@especializados.com.br",
            "phone": "(11) 1111-2222",
            "address": "Rua dos Serviços, 654",
            "city": "São Paulo",
            "state": "SP",
            "category": "Prestador de Serviços",
            "status": "ativo",
            "rating": 4.0
        }
    ]
    
    try:
        # Verificar se já existem fornecedores
        existing_count = db.query(Supplier).filter(Supplier.company_id == maria_company_id).count()
        if existing_count > 0:
            print(f"⚠️  Já existem {existing_count} fornecedores para a empresa Maria")
            return
        
        # Criar fornecedores
        for supplier_data in test_suppliers:
            supplier = Supplier(
                company_id=maria_company_id,
                **supplier_data
            )
            db.add(supplier)
            print(f"  ✅ Criado: {supplier_data['name']}")
        
        db.commit()
        print(f"✅ {len(test_suppliers)} fornecedores criados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_suppliers() 