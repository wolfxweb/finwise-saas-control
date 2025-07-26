from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class MovementType(enum.Enum):
    ENTRY = "entry"           # Entrada de estoque
    EXIT = "exit"             # Saída de estoque
    ADJUSTMENT = "adjustment" # Ajuste de estoque
    TRANSFER = "transfer"     # Transferência entre locais
    RESERVATION = "reservation" # Reserva de estoque
    RETURN = "return"         # Retorno de mercadoria

class MovementReason(enum.Enum):
    PURCHASE = "purchase"           # Compra
    SALE = "sale"                   # Venda
    TRANSFER_IN = "transfer_in"     # Transferência entrada
    TRANSFER_OUT = "transfer_out"   # Transferência saída
    ADJUSTMENT_POSITIVE = "adjustment_positive"  # Ajuste positivo
    ADJUSTMENT_NEGATIVE = "adjustment_negative"  # Ajuste negativo
    INVENTORY = "inventory"         # Inventário
    DAMAGED = "damaged"             # Produto danificado
    EXPIRED = "expired"             # Produto vencido
    LOSS = "loss"                   # Perda
    RETURN_CUSTOMER = "return_customer"  # Retorno do cliente
    RETURN_SUPPLIER = "return_supplier"  # Retorno ao fornecedor

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relacionamentos principais
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku_id = Column(Integer, ForeignKey("product_skus.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Tipo e motivo da movimentação
    movement_type = Column(Enum(MovementType), nullable=False)
    movement_reason = Column(Enum(MovementReason), nullable=False)
    
    # Quantidades
    quantity = Column(Integer, nullable=False)  # Quantidade movimentada
    previous_stock = Column(Integer, nullable=False)  # Estoque anterior
    current_stock = Column(Integer, nullable=False)  # Estoque atual
    
    # Informações de referência
    reference_document = Column(String(100))  # Número do documento (NF, pedido, etc.)
    reference_id = Column(Integer)  # ID do documento relacionado
    
    # Localização
    from_location = Column(String(100))  # Local de origem
    to_location = Column(String(100))    # Local de destino
    
    # Informações financeiras
    unit_cost = Column(Float)  # Custo unitário no momento da movimentação
    total_cost = Column(Float)  # Custo total da movimentação
    
    # Observações
    notes = Column(Text)
    
    # Usuário responsável
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    product = relationship("Product", back_populates="stock_movements")
    sku = relationship("ProductSKU", back_populates="stock_movements")
    company = relationship("Company")
    user = relationship("User")
    
    def __repr__(self):
        return f"<StockMovement(id={self.id}, type='{self.movement_type.value}', quantity={self.quantity}, sku_id={self.sku_id})>"
    
    @property
    def movement_description(self):
        """Descrição legível da movimentação"""
        type_map = {
            MovementType.ENTRY: "Entrada",
            MovementType.EXIT: "Saída",
            MovementType.ADJUSTMENT: "Ajuste",
            MovementType.TRANSFER: "Transferência",
            MovementType.RESERVATION: "Reserva",
            MovementType.RETURN: "Retorno"
        }
        
        reason_map = {
            MovementReason.PURCHASE: "Compra",
            MovementReason.SALE: "Venda",
            MovementReason.TRANSFER_IN: "Transferência Entrada",
            MovementReason.TRANSFER_OUT: "Transferência Saída",
            MovementReason.ADJUSTMENT_POSITIVE: "Ajuste Positivo",
            MovementReason.ADJUSTMENT_NEGATIVE: "Ajuste Negativo",
            MovementReason.INVENTORY: "Inventário",
            MovementReason.DAMAGED: "Produto Danificado",
            MovementReason.EXPIRED: "Produto Vencido",
            MovementReason.LOSS: "Perda",
            MovementReason.RETURN_CUSTOMER: "Retorno Cliente",
            MovementReason.RETURN_SUPPLIER: "Retorno Fornecedor"
        }
        
        return f"{type_map.get(self.movement_type, 'Movimentação')} - {reason_map.get(self.movement_reason, 'Não especificado')}"
    
    def calculate_total_cost(self):
        """Calcula o custo total da movimentação"""
        if self.unit_cost and self.quantity:
            return self.unit_cost * self.quantity
        return 0.0 