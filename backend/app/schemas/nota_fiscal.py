from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NotaFiscalProdutoBase(BaseModel):
    codigo: str
    descricao: str
    ncm: Optional[str] = None
    cfop: str
    unidade: str
    quantidade: float
    valor_unitario: float
    valor_total: float
    valor_icms: float = 0.0
    valor_ipi: float = 0.0
    valor_pis: float = 0.0
    valor_cofins: float = 0.0
    informacoes_adicionais: Optional[str] = None


class NotaFiscalProdutoCreate(NotaFiscalProdutoBase):
    pass


class NotaFiscalProduto(NotaFiscalProdutoBase):
    id: int
    nota_fiscal_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotaFiscalBase(BaseModel):
    numero: str
    serie: str
    tipo: str  # entrada, saida
    natureza_operacao: str
    data_emissao: datetime
    data_entrada_saida: Optional[datetime] = None
    origem: str = "manual"  # manual, sefaz, erp, email, api
    
    # Emitente
    emitente_nome: str
    emitente_cnpj: str
    emitente_ie: Optional[str] = None
    emitente_endereco: Optional[Dict[str, Any]] = None
    
    # Destinatário
    destinatario_nome: str
    destinatario_documento: str
    destinatario_email: Optional[str] = None
    destinatario_telefone: Optional[str] = None
    destinatario_endereco: Optional[Dict[str, Any]] = None
    
    # Valores
    valor_total: float
    valor_produtos: float = 0.0
    valor_icms: float = 0.0
    valor_ipi: float = 0.0
    valor_pis: float = 0.0
    valor_cofins: float = 0.0
    valor_frete: float = 0.0
    valor_seguro: float = 0.0
    valor_desconto: float = 0.0
    
    # Pagamento
    forma_pagamento: Optional[str] = None
    condicao_pagamento: Optional[str] = None
    
    # Transporte
    transportadora_nome: Optional[str] = None
    transportadora_cnpj: Optional[str] = None
    transportadora_placa: Optional[str] = None
    transportadora_uf: Optional[str] = None
    
    # Informações adicionais
    observacoes: Optional[str] = None
    informacoes_adicionais: Optional[str] = None
    
    # XML
    xml_content: Optional[str] = None
    xml_filename: Optional[str] = None


class NotaFiscalCreate(NotaFiscalBase):
    produtos: List[NotaFiscalProdutoCreate]
    company_id: UUID


class NotaFiscalUpdate(BaseModel):
    numero: Optional[str] = None
    serie: Optional[str] = None
    tipo: Optional[str] = None
    natureza_operacao: Optional[str] = None
    data_emissao: Optional[datetime] = None
    data_entrada_saida: Optional[datetime] = None
    status: Optional[str] = None
    origem: Optional[str] = None
    protocolo_autorizacao: Optional[str] = None
    data_autorizacao: Optional[datetime] = None
    emitente_nome: Optional[str] = None
    emitente_cnpj: Optional[str] = None
    emitente_ie: Optional[str] = None
    emitente_endereco: Optional[Dict[str, Any]] = None
    destinatario_nome: Optional[str] = None
    destinatario_documento: Optional[str] = None
    destinatario_email: Optional[str] = None
    destinatario_telefone: Optional[str] = None
    destinatario_endereco: Optional[Dict[str, Any]] = None
    valor_total: Optional[float] = None
    valor_produtos: Optional[float] = None
    valor_icms: Optional[float] = None
    valor_ipi: Optional[float] = None
    valor_pis: Optional[float] = None
    valor_cofins: Optional[float] = None
    valor_frete: Optional[float] = None
    valor_seguro: Optional[float] = None
    valor_desconto: Optional[float] = None
    forma_pagamento: Optional[str] = None
    condicao_pagamento: Optional[str] = None
    transportadora_nome: Optional[str] = None
    transportadora_cnpj: Optional[str] = None
    transportadora_placa: Optional[str] = None
    transportadora_uf: Optional[str] = None
    observacoes: Optional[str] = None
    informacoes_adicionais: Optional[str] = None
    xml_content: Optional[str] = None
    xml_filename: Optional[str] = None


class NotaFiscal(NotaFiscalBase):
    id: int
    status: str = "pendente"
    origem: str = "manual"
    protocolo_autorizacao: Optional[str] = None
    data_autorizacao: Optional[datetime] = None
    company_id: UUID
    produtos: List[NotaFiscalProduto] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotaFiscalList(BaseModel):
    id: int
    numero: str
    serie: str
    tipo: str
    data_emissao: datetime
    emitente_nome: str
    destinatario_nome: str
    valor_total: float
    status: str
    origem: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotaFiscalImport(BaseModel):
    xml_content: str
    xml_filename: str
    company_id: Optional[UUID] = None
    tipo: str = "entrada"  # entrada ou saida
    origem: str = "manual"  # manual, sefaz, erp, email, api


class NotaFiscalResponse(BaseModel):
    success: bool
    message: str
    data: Optional[NotaFiscal] = None
    errors: Optional[List[str]] = None 