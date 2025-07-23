#!/usr/bin/env python3
"""
Script para corrigir os módulos da empresa Maria
Associa os módulos do plano Empresarial à empresa Maria
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.company import Company
from app.models.plan import Plan, PlanModule, CompanyModule, CompanySubscription
from app.models.user import User
from datetime import datetime, timedelta
import uuid

def fix_maria_modules():
    """Corrigir módulos da empresa Maria"""
    print("🔧 Corrigindo módulos da empresa Maria...")
    db = SessionLocal()
    
    try:
        # Buscar empresa Maria
        maria_company = db.query(Company).filter(Company.name == "maria").first()
        if not maria_company:
            print("❌ Empresa Maria não encontrada")
            return
        
        print(f"✅ Empresa encontrada: {maria_company.name} (ID: {maria_company.id})")
        
        # Buscar assinatura da Maria
        subscription = db.query(CompanySubscription).filter(
            CompanySubscription.company_id == maria_company.id
        ).first()
        
        if not subscription:
            print("❌ Assinatura da Maria não encontrada")
            return
        
        print(f"✅ Assinatura encontrada: {subscription.status} (ID: {subscription.id})")
        
        # Buscar plano Empresarial
        plan = db.query(Plan).filter(Plan.name == "Empresarial").first()
        if not plan:
            print("❌ Plano Empresarial não encontrado")
            return
        
        print(f"✅ Plano encontrado: {plan.name} (ID: {plan.id})")
        
        # Buscar módulos do plano Empresarial
        plan_modules = db.query(PlanModule).filter(
            PlanModule.plan_id == plan.id,
            PlanModule.is_included == True
        ).all()
        
        print(f"✅ Encontrados {len(plan_modules)} módulos no plano")
        
        # Remover módulos existentes da Maria (se houver)
        existing_modules = db.query(CompanyModule).filter(
            CompanyModule.company_id == maria_company.id
        ).all()
        
        if existing_modules:
            print(f"🗑️  Removendo {len(existing_modules)} módulos existentes")
            for module in existing_modules:
                db.delete(module)
        
        # Associar módulos do plano à Maria
        modules_added = 0
        for plan_module in plan_modules:
            company_module = CompanyModule(
                company_id=maria_company.id,
                module_id=plan_module.module_id,
                subscription_id=subscription.id,
                status="active",
                price=0,  # Incluído no plano
                start_date=datetime.utcnow().date(),
                end_date=subscription.end_date
            )
            db.add(company_module)
            modules_added += 1
        
        db.commit()
        print(f"✅ {modules_added} módulos associados à empresa Maria")
        
        # Listar módulos associados
        print("\n📋 Módulos associados à Maria:")
        maria_modules = db.query(CompanyModule).filter(
            CompanyModule.company_id == maria_company.id
        ).all()
        
        for cm in maria_modules:
            module = db.query(Plan).filter(Plan.id == cm.module_id).first()
            if module:
                print(f"  ✅ {module.name}")
        
        print("\n🎉 Módulos da empresa Maria corrigidos com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_maria_modules() 