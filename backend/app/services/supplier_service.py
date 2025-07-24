from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models.supplier import Supplier, SupplierContact
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierContactCreate, SupplierContactUpdate
# Removido import problemático
import uuid

class SupplierService:
    def __init__(self, db: Session):
        self.db = db

    def create_supplier(self, supplier_data: SupplierCreate, company_id: str) -> Supplier:
        """Criar um novo fornecedor para a empresa"""
        supplier = Supplier(
            id=str(uuid.uuid4()),
            company_id=company_id,
            **supplier_data.dict()
        )
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def get_suppliers(
        self, 
        company_id: str, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None
    ) -> tuple[List[Supplier], int]:
        """Buscar fornecedores da empresa com filtros"""
        query = self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True
            )
        )

        # Aplicar filtros
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Supplier.name.ilike(search_term),
                    Supplier.corporate_name.ilike(search_term),
                    Supplier.cnpj.ilike(search_term),
                    Supplier.cpf.ilike(search_term),
                    Supplier.email.ilike(search_term),
                    Supplier.city.ilike(search_term)
                )
            )

        if status:
            query = query.filter(Supplier.status == status)

        if category:
            query = query.filter(Supplier.category == category)

        # Contar total
        total = query.count()

        # Aplicar paginação
        suppliers = query.offset(skip).limit(limit).all()

        return suppliers, total

    def get_supplier_by_id(self, supplier_id: str, company_id: str) -> Optional[Supplier]:
        """Buscar fornecedor específico da empresa"""
        return self.db.query(Supplier).filter(
            and_(
                Supplier.id == supplier_id,
                Supplier.company_id == company_id,
                Supplier.is_active == True
            )
        ).first()

    def get_supplier_with_contacts(self, supplier_id: str, company_id: str) -> Optional[Supplier]:
        """Buscar fornecedor com seus contatos"""
        return self.db.query(Supplier).filter(
            and_(
                Supplier.id == supplier_id,
                Supplier.company_id == company_id,
                Supplier.is_active == True
            )
        ).first()

    def update_supplier(
        self, 
        supplier_id: str, 
        supplier_data: SupplierUpdate, 
        company_id: str
    ) -> Optional[Supplier]:
        """Atualizar fornecedor da empresa"""
        supplier = self.get_supplier_by_id(supplier_id, company_id)
        if not supplier:
            return None

        # Atualizar apenas campos fornecidos
        update_data = supplier_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)

        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def delete_supplier(self, supplier_id: str, company_id: str) -> bool:
        """Deletar fornecedor da empresa (soft delete)"""
        supplier = self.get_supplier_by_id(supplier_id, company_id)
        if not supplier:
            return False

        supplier.is_active = False
        self.db.commit()
        return True

    def get_supplier_stats(self, company_id: str) -> dict:
        """Obter estatísticas dos fornecedores da empresa"""
        total_suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True
            )
        ).count()

        active_suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
                Supplier.status == "ativo"
            )
        ).count()

        inactive_suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
                Supplier.status == "inativo"
            )
        ).count()

        blocked_suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
                Supplier.status == "bloqueado"
            )
        ).count()

        avg_rating = self.db.query(func.avg(Supplier.rating)).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
                Supplier.rating > 0
            )
        ).scalar() or 0.0

        return {
            "total_suppliers": total_suppliers,
            "active_suppliers": active_suppliers,
            "inactive_suppliers": inactive_suppliers,
            "blocked_suppliers": blocked_suppliers,
            "average_rating": round(float(avg_rating), 1)
        }

    def get_suppliers_by_category(self, company_id: str) -> List[dict]:
        """Obter fornecedores agrupados por categoria"""
        result = self.db.query(
            Supplier.category,
            func.count(Supplier.id).label('count')
        ).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True
            )
        ).group_by(Supplier.category).all()

        return [
            {"category": item.category or "Sem categoria", "count": item.count}
            for item in result
        ]

    def search_suppliers(self, company_id: str, search_term: str) -> List[Supplier]:
        """Buscar fornecedores por termo de busca"""
        search_pattern = f"%{search_term}%"
        return self.db.query(Supplier).filter(
            and_(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
                or_(
                    Supplier.name.ilike(search_pattern),
                    Supplier.corporate_name.ilike(search_pattern),
                    Supplier.cnpj.ilike(search_pattern),
                    Supplier.cpf.ilike(search_pattern),
                    Supplier.email.ilike(search_pattern),
                    Supplier.city.ilike(search_pattern)
                )
            )
        ).limit(10).all()

    # Métodos para gerenciar contatos
    def create_contact(self, supplier_id: str, contact_data: SupplierContactCreate, company_id: str) -> Optional[SupplierContact]:
        """Criar um novo contato para o fornecedor"""
        # Verificar se o fornecedor existe e pertence à empresa
        supplier = self.get_supplier_by_id(supplier_id, company_id)
        if not supplier:
            return None

        # Se este contato for principal, remover a flag principal dos outros contatos
        if contact_data.is_primary:
            self.db.query(SupplierContact).filter(
                and_(
                    SupplierContact.supplier_id == supplier_id,
                    SupplierContact.company_id == company_id,
                    SupplierContact.is_active == True
                )
            ).update({"is_primary": False})

        contact = SupplierContact(
            id=str(uuid.uuid4()),
            supplier_id=supplier_id,
            company_id=company_id,
            **contact_data.dict()
        )
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def get_contacts(self, supplier_id: str, company_id: str) -> List[SupplierContact]:
        """Buscar todos os contatos de um fornecedor"""
        # Verificar se o fornecedor existe e pertence à empresa
        supplier = self.get_supplier_by_id(supplier_id, company_id)
        if not supplier:
            return []

        return self.db.query(SupplierContact).filter(
            and_(
                SupplierContact.supplier_id == supplier_id,
                SupplierContact.company_id == company_id,
                SupplierContact.is_active == True
            )
        ).all()

    def get_contact_by_id(self, contact_id: str, supplier_id: str, company_id: str) -> Optional[SupplierContact]:
        """Buscar contato específico"""
        # Verificar se o fornecedor existe e pertence à empresa
        supplier = self.get_supplier_by_id(supplier_id, company_id)
        if not supplier:
            return None

        return self.db.query(SupplierContact).filter(
            and_(
                SupplierContact.id == contact_id,
                SupplierContact.supplier_id == supplier_id,
                SupplierContact.company_id == company_id,
                SupplierContact.is_active == True
            )
        ).first()

    def update_contact(
        self, 
        contact_id: str, 
        supplier_id: str, 
        contact_data: SupplierContactUpdate, 
        company_id: str
    ) -> Optional[SupplierContact]:
        """Atualizar contato"""
        contact = self.get_contact_by_id(contact_id, supplier_id, company_id)
        if not contact:
            return None

        # Se este contato for marcado como principal, remover a flag dos outros
        if contact_data.is_primary:
            self.db.query(SupplierContact).filter(
                and_(
                    SupplierContact.supplier_id == supplier_id,
                    SupplierContact.company_id == company_id,
                    SupplierContact.id != contact_id,
                    SupplierContact.is_active == True
                )
            ).update({"is_primary": False})

        # Atualizar apenas campos fornecidos
        update_data = contact_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)

        self.db.commit()
        self.db.refresh(contact)
        return contact

    def delete_contact(self, contact_id: str, supplier_id: str, company_id: str) -> bool:
        """Deletar contato (soft delete)"""
        contact = self.get_contact_by_id(contact_id, supplier_id, company_id)
        if not contact:
            return False

        contact.is_active = False
        self.db.commit()
        return True 