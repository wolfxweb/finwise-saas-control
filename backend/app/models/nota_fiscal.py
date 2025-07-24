from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class NotaFiscal(Base):
    __tablename__ = "notas_fiscais"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informações básicas
    numero = Column(String(50), nullable=False, index=True)
    serie = Column(String(10), nullable=False)
    tipo = Column(String(20), nullable=False)  # entrada, saida
    natureza_operacao = Column(String(255), nullable=False)
    data_emissao = Column(DateTime, nullable=False)
    data_entrada_saida = Column(DateTime, nullable=True)
    
    # Status
    status = Column(String(50), default="pendente")  # pendente, autorizada, cancelada, denegada
    origem = Column(String(50), default="manual")  # manual, sefaz, erp, email, api
    protocolo_autorizacao = Column(String(100), nullable=True)
    data_autorizacao = Column(DateTime, nullable=True)
    
    # Emitente
    emitente_nome = Column(String(255), nullable=False)
    emitente_cnpj = Column(String(18), nullable=False)
    emitente_ie = Column(String(20), nullable=True)
    emitente_endereco = Column(JSON, nullable=True)
    
    # Destinatário
    destinatario_nome = Column(String(255), nullable=False)
    destinatario_documento = Column(String(18), nullable=False)  # CPF ou CNPJ
    destinatario_email = Column(String(255), nullable=True)
    destinatario_telefone = Column(String(20), nullable=True)
    destinatario_endereco = Column(JSON, nullable=True)
    
    # Valores
    valor_total = Column(Float, nullable=False, default=0.0)
    valor_produtos = Column(Float, nullable=False, default=0.0)
    valor_icms = Column(Float, nullable=False, default=0.0)
    valor_ipi = Column(Float, nullable=False, default=0.0)
    valor_pis = Column(Float, nullable=False, default=0.0)
    valor_cofins = Column(Float, nullable=False, default=0.0)
    valor_frete = Column(Float, nullable=False, default=0.0)
    valor_seguro = Column(Float, nullable=False, default=0.0)
    valor_desconto = Column(Float, nullable=False, default=0.0)
    
    # Pagamento
    forma_pagamento = Column(String(100), nullable=True)
    condicao_pagamento = Column(String(255), nullable=True)
    
    # Transporte
    transportadora_nome = Column(String(255), nullable=True)
    transportadora_cnpj = Column(String(18), nullable=True)
    transportadora_placa = Column(String(10), nullable=True)
    transportadora_uf = Column(String(2), nullable=True)
    
    # Informações adicionais
    observacoes = Column(Text, nullable=True)
    informacoes_adicionais = Column(Text, nullable=True)
    
    # XML e arquivos
    xml_content = Column(Text, nullable=True)  # XML completo da nota
    xml_filename = Column(String(255), nullable=True)
    
    # Relacionamentos
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", back_populates="notas_fiscais")
    
    # Produtos (relacionamento one-to-many)
    produtos = relationship("NotaFiscalProduto", back_populates="nota_fiscal", cascade="all, delete-orphan")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NotaFiscalProduto(Base):
    __tablename__ = "notas_fiscais_produtos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relacionamento
    nota_fiscal_id = Column(Integer, ForeignKey("notas_fiscais.id"), nullable=False)
    nota_fiscal = relationship("NotaFiscal", back_populates="produtos")
    
    # Informações do produto
    codigo = Column(String(50), nullable=False)
    descricao = Column(String(500), nullable=False)
    ncm = Column(String(10), nullable=True)
    cfop = Column(String(10), nullable=False)
    unidade = Column(String(10), nullable=False)
    
    # Quantidades e valores
    quantidade = Column(Float, nullable=False)
    valor_unitario = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)
    
    # Impostos
    valor_icms = Column(Float, nullable=False, default=0.0)
    valor_ipi = Column(Float, nullable=False, default=0.0)
    valor_pis = Column(Float, nullable=False, default=0.0)
    valor_cofins = Column(Float, nullable=False, default=0.0)
    
    # Informações adicionais
    informacoes_adicionais = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 