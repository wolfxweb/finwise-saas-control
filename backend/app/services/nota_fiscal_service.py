import xml.etree.ElementTree as ET
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.models.nota_fiscal import NotaFiscal, NotaFiscalProduto
from app.schemas.nota_fiscal import NotaFiscalCreate, NotaFiscalUpdate, NotaFiscalImport
from uuid import UUID


class NotaFiscalService:
    
    @staticmethod
    def parse_xml_nfe(xml_content: str) -> Dict[str, Any]:
        """Parse XML da NFe e extrai os dados"""
        try:
            # Remove namespace para facilitar parsing
            xml_content_clean = xml_content.replace('xmlns="http://www.portalfiscal.inf.br/nfe"', '')
            root = ET.fromstring(xml_content_clean)
            
            # Extrair dados básicos
            ide = root.find('.//ide')
            emit = root.find('.//emit')
            dest = root.find('.//dest')
            total = root.find('.//total')
            transp = root.find('.//transp')
            pag = root.find('.//pag')
            
            # Dados básicos
            numero = ide.find('nNF').text if ide.find('nNF') is not None else ""
            serie = ide.find('serie').text if ide.find('serie') is not None else ""
            tipo = "entrada" if ide.find('tpNF').text == "0" else "saida"
            natureza_operacao = ide.find('natOp').text if ide.find('natOp') is not None else ""
            
            # Data de emissão
            data_emissao_str = ide.find('dhEmi').text if ide.find('dhEmi') is not None else ""
            if data_emissao_str:
                try:
                    # Tentar diferentes formatos de data
                    if 'T' in data_emissao_str:
                        # Formato: 2025-07-24T10:30:00-03:00
                        data_emissao = datetime.fromisoformat(data_emissao_str)
                    else:
                        # Formato: 2025-07-24
                        data_emissao = datetime.strptime(data_emissao_str, '%Y-%m-%d')
                except ValueError:
                    print(f"DEBUG: Erro ao parsear data: {data_emissao_str}")
                    data_emissao = datetime.now()
            else:
                data_emissao = datetime.now()
            
            # Emitente
            emitente_nome = emit.find('.//xNome').text if emit.find('.//xNome') is not None else ""
            emitente_cnpj = emit.find('.//CNPJ').text if emit.find('.//CNPJ') is not None else ""
            emitente_ie = emit.find('.//IE').text if emit.find('.//IE') is not None else ""
            
            # Endereço do emitente
            end_emit = emit.find('.//enderEmit')
            emitente_endereco = {}
            if end_emit is not None:
                emitente_endereco = {
                    "logradouro": end_emit.find('xLgr').text if end_emit.find('xLgr') is not None else "",
                    "numero": end_emit.find('nro').text if end_emit.find('nro') is not None else "",
                    "bairro": end_emit.find('xBairro').text if end_emit.find('xBairro') is not None else "",
                    "cidade": end_emit.find('xMun').text if end_emit.find('xMun') is not None else "",
                    "estado": end_emit.find('UF').text if end_emit.find('UF') is not None else "",
                    "cep": end_emit.find('CEP').text if end_emit.find('CEP') is not None else "",
                }
            
            # Destinatário
            destinatario_nome = dest.find('.//xNome').text if dest.find('.//xNome') is not None else ""
            destinatario_documento = dest.find('.//CNPJ').text if dest.find('.//CNPJ') is not None else ""
            if not destinatario_documento:
                destinatario_documento = dest.find('.//CPF').text if dest.find('.//CPF') is not None else ""
            
            # Endereço do destinatário
            end_dest = dest.find('.//enderDest')
            destinatario_endereco = {}
            if end_dest is not None:
                destinatario_endereco = {
                    "logradouro": end_dest.find('xLgr').text if end_dest.find('xLgr') is not None else "",
                    "numero": end_dest.find('nro').text if end_dest.find('nro') is not None else "",
                    "bairro": end_dest.find('xBairro').text if end_dest.find('xBairro') is not None else "",
                    "cidade": end_dest.find('xMun').text if end_dest.find('xMun') is not None else "",
                    "estado": end_dest.find('UF').text if end_dest.find('UF') is not None else "",
                    "cep": end_dest.find('CEP').text if end_dest.find('CEP') is not None else "",
                }
            
            # Valores
            icms_total = total.find('.//ICMSTot')
            valor_total = float(icms_total.find('vNF').text) if icms_total.find('vNF') is not None else 0.0
            valor_produtos = float(icms_total.find('vProd').text) if icms_total.find('vProd') is not None else 0.0
            valor_icms = float(icms_total.find('vICMS').text) if icms_total.find('vICMS') is not None else 0.0
            valor_ipi = float(icms_total.find('vIPI').text) if icms_total.find('vIPI') is not None else 0.0
            valor_pis = float(icms_total.find('vPIS').text) if icms_total.find('vPIS') is not None else 0.0
            valor_cofins = float(icms_total.find('vCOFINS').text) if icms_total.find('vCOFINS') is not None else 0.0
            valor_frete = float(icms_total.find('vFrete').text) if icms_total.find('vFrete') is not None else 0.0
            valor_seguro = float(icms_total.find('vSeg').text) if icms_total.find('vSeg') is not None else 0.0
            valor_desconto = float(icms_total.find('vDesc').text) if icms_total.find('vDesc') is not None else 0.0
            
            # Transporte
            transportadora_nome = ""
            transportadora_cnpj = ""
            transportadora_placa = ""
            transportadora_uf = ""
            
            if transp is not None:
                transp_info = transp.find('.//transporta')
                if transp_info is not None:
                    transportadora_nome = transp_info.find('xNome').text if transp_info.find('xNome') is not None else ""
                    transportadora_cnpj = transp_info.find('CNPJ').text if transp_info.find('CNPJ') is not None else ""
                    transportadora_placa = transp_info.find('placa').text if transp_info.find('placa') is not None else ""
                    transportadora_uf = transp_info.find('UF').text if transp_info.find('UF') is not None else ""
            
            # Produtos
            produtos = []
            det_items = root.findall('.//det')
            
            for det in det_items:
                prod = det.find('prod')
                if prod is not None:
                    produto = {
                        "codigo": prod.find('cProd').text if prod.find('cProd') is not None else "",
                        "descricao": prod.find('xProd').text if prod.find('xProd') is not None else "",
                        "ncm": prod.find('NCM').text if prod.find('NCM') is not None else "",
                        "cfop": prod.find('CFOP').text if prod.find('CFOP') is not None else "",
                        "unidade": prod.find('uCom').text if prod.find('uCom') is not None else "",
                        "quantidade": float(prod.find('qCom').text) if prod.find('qCom') is not None else 0.0,
                        "valor_unitario": float(prod.find('vUnCom').text) if prod.find('vUnCom') is not None else 0.0,
                        "valor_total": float(prod.find('vProd').text) if prod.find('vProd') is not None else 0.0,
                        "valor_icms": 0.0,
                        "valor_ipi": 0.0,
                        "valor_pis": 0.0,
                        "valor_cofins": 0.0,
                    }
                    
                    # Impostos do produto
                    imposto = det.find('imposto')
                    if imposto is not None:
                        icms = imposto.find('.//ICMS')
                        if icms is not None:
                            icms_trib = icms.find('.//ICMSTrib')
                            if icms_trib is not None:
                                produto["valor_icms"] = float(icms_trib.find('vICMS').text) if icms_trib.find('vICMS') is not None else 0.0
                        
                        ipi = imposto.find('.//IPI')
                        if ipi is not None:
                            ipi_trib = ipi.find('.//IPITrib')
                            if ipi_trib is not None:
                                produto["valor_ipi"] = float(ipi_trib.find('vIPI').text) if ipi_trib.find('vIPI') is not None else 0.0
                        
                        pis = imposto.find('.//PIS')
                        if pis is not None:
                            pis_trib = pis.find('.//PISAliq')
                            if pis_trib is not None:
                                produto["valor_pis"] = float(pis_trib.find('vPIS').text) if pis_trib.find('vPIS') is not None else 0.0
                        
                        cofins = imposto.find('.//COFINS')
                        if cofins is not None:
                            cofins_trib = cofins.find('.//COFINSAliq')
                            if cofins_trib is not None:
                                produto["valor_cofins"] = float(cofins_trib.find('vCOFINS').text) if cofins_trib.find('vCOFINS') is not None else 0.0
                    
                    produtos.append(produto)
            
            return {
                "numero": numero,
                "serie": serie,
                "tipo": tipo,
                "natureza_operacao": natureza_operacao,
                "data_emissao": data_emissao,
                "emitente_nome": emitente_nome,
                "emitente_cnpj": emitente_cnpj,
                "emitente_ie": emitente_ie,
                "emitente_endereco": emitente_endereco,
                "destinatario_nome": destinatario_nome,
                "destinatario_documento": destinatario_documento,
                "destinatario_endereco": destinatario_endereco,
                "valor_total": valor_total,
                "valor_produtos": valor_produtos,
                "valor_icms": valor_icms,
                "valor_ipi": valor_ipi,
                "valor_pis": valor_pis,
                "valor_cofins": valor_cofins,
                "valor_frete": valor_frete,
                "valor_seguro": valor_seguro,
                "valor_desconto": valor_desconto,
                "transportadora_nome": transportadora_nome,
                "transportadora_cnpj": transportadora_cnpj,
                "transportadora_placa": transportadora_placa,
                "transportadora_uf": transportadora_uf,
                "produtos": produtos,
            }
            
        except Exception as e:
            raise ValueError(f"Erro ao processar XML: {str(e)}")
    
    @staticmethod
    def create_nota_fiscal(db: Session, nota_fiscal_data: NotaFiscalCreate) -> NotaFiscal:
        """Cria uma nova nota fiscal no banco de dados"""
        try:
            # Verificar se já existe uma nota fiscal com o mesmo número, série e emitente (CNPJ e nome)
            # NOTA: Esta validação já foi feita na função import_xml_nota_fiscal, então não precisamos duplicar aqui
            # Apenas manter para casos onde create_nota_fiscal é chamada diretamente
            if NotaFiscalService.check_nota_fiscal_exists(db, nota_fiscal_data.numero, nota_fiscal_data.serie, nota_fiscal_data.emitente_cnpj, nota_fiscal_data.emitente_nome, nota_fiscal_data.company_id):
                raise ValueError(f"Já existe uma nota fiscal com o número {nota_fiscal_data.numero} série {nota_fiscal_data.serie} do emitente {nota_fiscal_data.emitente_nome} ({nota_fiscal_data.emitente_cnpj})")
            
            # Criar nota fiscal
            db_nota_fiscal = NotaFiscal(
                numero=nota_fiscal_data.numero,
                serie=nota_fiscal_data.serie,
                tipo=nota_fiscal_data.tipo,
                natureza_operacao=nota_fiscal_data.natureza_operacao,
                data_emissao=nota_fiscal_data.data_emissao,
                data_entrada_saida=nota_fiscal_data.data_entrada_saida,
                origem=nota_fiscal_data.origem,
                emitente_nome=nota_fiscal_data.emitente_nome,
                emitente_cnpj=nota_fiscal_data.emitente_cnpj,
                emitente_ie=nota_fiscal_data.emitente_ie,
                emitente_endereco=nota_fiscal_data.emitente_endereco,
                destinatario_nome=nota_fiscal_data.destinatario_nome,
                destinatario_documento=nota_fiscal_data.destinatario_documento,
                destinatario_email=nota_fiscal_data.destinatario_email,
                destinatario_telefone=nota_fiscal_data.destinatario_telefone,
                destinatario_endereco=nota_fiscal_data.destinatario_endereco,
                valor_total=nota_fiscal_data.valor_total,
                valor_produtos=nota_fiscal_data.valor_produtos,
                valor_icms=nota_fiscal_data.valor_icms,
                valor_ipi=nota_fiscal_data.valor_ipi,
                valor_pis=nota_fiscal_data.valor_pis,
                valor_cofins=nota_fiscal_data.valor_cofins,
                valor_frete=nota_fiscal_data.valor_frete,
                valor_seguro=nota_fiscal_data.valor_seguro,
                valor_desconto=nota_fiscal_data.valor_desconto,
                forma_pagamento=nota_fiscal_data.forma_pagamento,
                condicao_pagamento=nota_fiscal_data.condicao_pagamento,
                transportadora_nome=nota_fiscal_data.transportadora_nome,
                transportadora_cnpj=nota_fiscal_data.transportadora_cnpj,
                transportadora_placa=nota_fiscal_data.transportadora_placa,
                transportadora_uf=nota_fiscal_data.transportadora_uf,
                observacoes=nota_fiscal_data.observacoes,
                informacoes_adicionais=nota_fiscal_data.informacoes_adicionais,
                xml_content=nota_fiscal_data.xml_content,
                xml_filename=nota_fiscal_data.xml_filename,
                company_id=nota_fiscal_data.company_id,
            )
            
            db.add(db_nota_fiscal)
            db.flush()  # Para obter o ID da nota fiscal
            
            # Criar produtos
            for produto_data in nota_fiscal_data.produtos:
                db_produto = NotaFiscalProduto(
                    nota_fiscal_id=db_nota_fiscal.id,
                    codigo=produto_data.codigo,
                    descricao=produto_data.descricao,
                    ncm=produto_data.ncm,
                    cfop=produto_data.cfop,
                    unidade=produto_data.unidade,
                    quantidade=produto_data.quantidade,
                    valor_unitario=produto_data.valor_unitario,
                    valor_total=produto_data.valor_total,
                    valor_icms=produto_data.valor_icms,
                    valor_ipi=produto_data.valor_ipi,
                    valor_pis=produto_data.valor_pis,
                    valor_cofins=produto_data.valor_cofins,
                    informacoes_adicionais=produto_data.informacoes_adicionais,
                )
                db.add(db_produto)
            
            db.commit()
            db.refresh(db_nota_fiscal)
            return db_nota_fiscal
            
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erro ao criar nota fiscal: {str(e)}")
    
    @staticmethod
    def import_xml_nota_fiscal(db: Session, import_data: NotaFiscalImport) -> NotaFiscal:
        """Importa nota fiscal a partir de XML"""
        try:
            print(f"DEBUG: Iniciando importação de XML: {import_data.xml_filename}")
            print(f"DEBUG: Tamanho do XML: {len(import_data.xml_content)} caracteres")
            print(f"DEBUG: Tipo: {import_data.tipo}")
            print(f"DEBUG: Origem: {import_data.origem}")
            print(f"DEBUG: Handle Duplicates: {import_data.handle_duplicates}")
            
            # Parse do XML
            parsed_data = NotaFiscalService.parse_xml_nfe(import_data.xml_content)
            print(f"DEBUG: XML parseado com sucesso. Dados extraídos: {len(parsed_data.get('produtos', []))} produtos")
            
            # Verificar se já existe uma nota fiscal com o mesmo número, série e emitente (CNPJ e nome)
            existing_nota = NotaFiscalService.get_nota_fiscal_by_numero_serie_emitente(db, parsed_data["numero"], parsed_data["serie"], parsed_data["emitente_cnpj"], parsed_data["emitente_nome"], import_data.company_id)
            
            if existing_nota:
                print(f"DEBUG: ❌ DUPLICATA ENCONTRADA: Número {parsed_data['numero']} Série {parsed_data['serie']} Emitente {parsed_data['emitente_nome']} ({parsed_data['emitente_cnpj']})")
                print(f"DEBUG: Ação escolhida: {import_data.handle_duplicates}")
                
                if import_data.handle_duplicates == "skip":
                    print(f"DEBUG: Pulando nota fiscal duplicada")
                    raise ValueError(f"Nota fiscal Nº {parsed_data['numero']} série {parsed_data['serie']} já foi importada anteriormente. Emitente: {parsed_data['emitente_nome']} ({parsed_data['emitente_cnpj']})")
                elif import_data.handle_duplicates == "overwrite":
                    # Deletar a nota fiscal existente para sobrescrever
                    print(f"DEBUG: Sobrescrevendo nota fiscal existente: {parsed_data['numero']} série {parsed_data['serie']} emitente {parsed_data['emitente_nome']}")
                    NotaFiscalService.delete_nota_fiscal(db, existing_nota.id, import_data.company_id)
                    print(f"DEBUG: Nota fiscal existente deletada com sucesso")
                else:
                    print(f"DEBUG: Valor inválido para handle_duplicates: {import_data.handle_duplicates}")
                    raise ValueError(f"Valor inválido para handle_duplicates: {import_data.handle_duplicates}")
            else:
                print(f"DEBUG: ✅ NOTA PERMITIDA: Número {parsed_data['numero']} Série {parsed_data['serie']} Emitente {parsed_data['emitente_nome']} ({parsed_data['emitente_cnpj']}) - Não é duplicata")
            
            # Criar objeto de criação
            nota_fiscal_create = NotaFiscalCreate(
                numero=parsed_data["numero"],
                serie=parsed_data["serie"],
                tipo=import_data.tipo,
                natureza_operacao=parsed_data["natureza_operacao"],
                data_emissao=parsed_data["data_emissao"],
                origem="manual",  # Notas importadas são sempre "manual"
                emitente_nome=parsed_data["emitente_nome"],
                emitente_cnpj=parsed_data["emitente_cnpj"],
                emitente_ie=parsed_data["emitente_ie"],
                emitente_endereco=parsed_data["emitente_endereco"],
                destinatario_nome=parsed_data["destinatario_nome"],
                destinatario_documento=parsed_data["destinatario_documento"],
                destinatario_endereco=parsed_data["destinatario_endereco"],
                valor_total=parsed_data["valor_total"],
                valor_produtos=parsed_data["valor_produtos"],
                valor_icms=parsed_data["valor_icms"],
                valor_ipi=parsed_data["valor_ipi"],
                valor_pis=parsed_data["valor_pis"],
                valor_cofins=parsed_data["valor_cofins"],
                valor_frete=parsed_data["valor_frete"],
                valor_seguro=parsed_data["valor_seguro"],
                valor_desconto=parsed_data["valor_desconto"],
                transportadora_nome=parsed_data["transportadora_nome"],
                transportadora_cnpj=parsed_data["transportadora_cnpj"],
                transportadora_placa=parsed_data["transportadora_placa"],
                transportadora_uf=parsed_data["transportadora_uf"],
                xml_content=import_data.xml_content,
                xml_filename=import_data.xml_filename,
                company_id=import_data.company_id,
                produtos=parsed_data["produtos"],
            )
            
            # Criar no banco
            return NotaFiscalService.create_nota_fiscal(db, nota_fiscal_create)
            
        except Exception as e:
            raise ValueError(f"Erro ao importar XML: {str(e)}")
    
    @staticmethod
    def get_notas_fiscais(db: Session, company_id: UUID, skip: int = 0, limit: int = 1000) -> List[NotaFiscal]:
        """Lista notas fiscais de uma empresa com paginação"""
        return db.query(NotaFiscal).filter(
            NotaFiscal.company_id == company_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_notas_fiscais(db: Session, company_id: UUID) -> List[NotaFiscal]:
        """Lista TODAS as notas fiscais de uma empresa sem limite"""
        return db.query(NotaFiscal).filter(
            NotaFiscal.company_id == company_id
        ).options(
            joinedload(NotaFiscal.produtos)
        ).all()
    
    @staticmethod
    def get_nota_fiscal(db: Session, nota_fiscal_id: int, company_id: UUID) -> Optional[NotaFiscal]:
        """Busca uma nota fiscal específica"""
        return db.query(NotaFiscal).filter(
            and_(NotaFiscal.id == nota_fiscal_id, NotaFiscal.company_id == company_id)
        ).first()
    
    @staticmethod
    def update_nota_fiscal(db: Session, nota_fiscal_id: int, company_id: UUID, update_data: NotaFiscalUpdate) -> Optional[NotaFiscal]:
        """Atualiza uma nota fiscal"""
        db_nota_fiscal = NotaFiscalService.get_nota_fiscal(db, nota_fiscal_id, company_id)
        if not db_nota_fiscal:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_nota_fiscal, field, value)
        
        db.commit()
        db.refresh(db_nota_fiscal)
        return db_nota_fiscal
    
    @staticmethod
    def delete_nota_fiscal(db: Session, nota_fiscal_id: int, company_id: UUID) -> bool:
        """Deleta uma nota fiscal"""
        db_nota_fiscal = NotaFiscalService.get_nota_fiscal(db, nota_fiscal_id, company_id)
        if not db_nota_fiscal:
            return False
        
        db.delete(db_nota_fiscal)
        db.commit()
        return True 

    @staticmethod
    def get_nota_fiscal_by_numero_serie_emitente(db: Session, numero: str, serie: str, emitente_cnpj: str, emitente_nome: str, company_id: UUID):
        """Busca uma nota fiscal pelo número, série, emitente (CNPJ e nome)"""
        return db.query(NotaFiscal).filter(
            and_(
                NotaFiscal.numero == numero,
                NotaFiscal.serie == serie,
                NotaFiscal.emitente_cnpj == emitente_cnpj,
                NotaFiscal.emitente_nome == emitente_nome,
                NotaFiscal.company_id == company_id
            )
        ).first()

    @staticmethod
    def get_nota_fiscal_by_numero_emitente(db: Session, numero: str, emitente_cnpj: str, company_id: UUID):
        """Busca uma nota fiscal pelo número e emitente"""
        return db.query(NotaFiscal).filter(
            and_(
                NotaFiscal.numero == numero,
                NotaFiscal.emitente_cnpj == emitente_cnpj,
                NotaFiscal.company_id == company_id
            )
        ).first()

    @staticmethod
    def check_nota_fiscal_exists(db: Session, numero: str, serie: str, emitente_cnpj: str, emitente_nome: str, company_id: UUID) -> bool:
        """Verifica se já existe uma nota fiscal com o mesmo número, série e emitente (CNPJ e nome)"""
        existing_nota = NotaFiscalService.get_nota_fiscal_by_numero_serie_emitente(db, numero, serie, emitente_cnpj, emitente_nome, company_id)
        return existing_nota is not None