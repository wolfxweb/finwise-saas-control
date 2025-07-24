from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List


class PDFService:
    
    @staticmethod
    def format_cnpj_cpf(documento: str) -> str:
        """Formata CNPJ ou CPF para exibição"""
        if not documento:
            return ""
        
        documento = documento.replace(".", "").replace("-", "").replace("/", "")
        
        if len(documento) == 11:  # CPF
            return f"{documento[:3]}.{documento[3:6]}.{documento[6:9]}-{documento[9:]}"
        elif len(documento) == 14:  # CNPJ
            return f"{documento[:2]}.{documento[2:5]}.{documento[5:8]}/{documento[8:12]}-{documento[12:]}"
        
        return documento
    
    @staticmethod
    def format_currency(value: float) -> str:
        """Formata valor monetário"""
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
    @staticmethod
    def format_date(date_str: str) -> str:
        """Formata data para exibição"""
        try:
            if isinstance(date_str, str):
                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                date_obj = date_str
            return date_obj.strftime("%d/%m/%Y")
        except:
            return str(date_str)
    
    @staticmethod
    def generate_nota_fiscal_pdf(nota_fiscal: Dict[str, Any]) -> BytesIO:
        """Gera PDF da nota fiscal no formato DANFE"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Estilos
        styles = getSampleStyleSheet()
        
        # Estilo para título principal
        title_style = ParagraphStyle(
            'DANFETitle',
            parent=styles['Heading1'],
            fontSize=14,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Estilo para cabeçalhos de seção
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=10,
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            backColor=colors.darkblue
        )
        
        # Estilo para texto normal
        normal_style = ParagraphStyle(
            'Normal',
            parent=styles['Normal'],
            fontSize=8,
            spaceAfter=4
        )
        
        # Estilo para texto pequeno
        small_style = ParagraphStyle(
            'Small',
            parent=styles['Normal'],
            fontSize=7,
            spaceAfter=2
        )
        
        # 1. CABEÇALHO - RECEBIMENTO
        recebimento_text = f"""
        RECEBEMOS DE {PDFService.format_cnpj_cpf(nota_fiscal.get('emitente_cnpj', ''))} {nota_fiscal.get('emitente_nome', '')} 
        OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA ABAIXO.
        """
        story.append(Paragraph(recebimento_text, normal_style))
        
        # Informações do recebimento
        recebimento_data = [
            ["EMISSÃO:", PDFService.format_date(nota_fiscal.get('data_emissao', ''))],
            ["VALOR TOTAL:", PDFService.format_currency(nota_fiscal.get('valor_total', 0))],
            ["DESTINATÁRIO:", f"{nota_fiscal.get('destinatario_nome', '')} - {PDFService.format_cnpj_cpf(nota_fiscal.get('destinatario_documento', ''))}"],
        ]
        
        recebimento_table = Table(recebimento_data, colWidths=[1.5*inch, 4*inch])
        recebimento_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(recebimento_table)
        story.append(Spacer(1, 10))
        
        # 2. CABEÇALHO DANFE
        danfe_header_data = [
            ["DANFE", f"N°. {nota_fiscal.get('numero', '').zfill(9)}", "Série {nota_fiscal.get('serie', '')}", "Folha 1/1"],
            ["", f"{'0 - ENTRADA' if nota_fiscal.get('tipo') == 'entrada' else '1 - SAÍDA'}", "", ""],
        ]
        
        danfe_header_table = Table(danfe_header_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1*inch])
        danfe_header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
        ]))
        story.append(danfe_header_table)
        story.append(Spacer(1, 10))
        
        # 3. CHAVE DE ACESSO (simulada)
        chave_acesso = "4225 0757 1743 4100 0109 5500 1000 0013 7818 2993 4074"  # Exemplo
        story.append(Paragraph(f"CHAVE DE ACESSO: {chave_acesso}", small_style))
        story.append(Paragraph("Consulte a chave de acesso em: www.nfe.fazenda.gov.br/portal ou em www.sefaz.estado.xx.gov.br", small_style))
        story.append(Spacer(1, 8))
        
        # 4. PROTOCOLO DE AUTORIZAÇÃO
        protocolo_text = f"PROTOCOLO DE AUTORIZAÇÃO DE USO: 242250280340558 - {PDFService.format_date(nota_fiscal.get('data_emissao', ''))} 19:40:57"
        story.append(Paragraph(protocolo_text, small_style))
        story.append(Spacer(1, 12))
        
        # 5. IDENTIFICAÇÃO DO EMITENTE
        story.append(Paragraph("IDENTIFICAÇÃO DO EMITENTE", section_style))
        
        emitente_data = [
            ["NOME/RAZÃO SOCIAL:", nota_fiscal.get('emitente_nome', '')],
            ["CNPJ/CPF:", PDFService.format_cnpj_cpf(nota_fiscal.get('emitente_cnpj', ''))],
            ["INSCRIÇÃO ESTADUAL:", nota_fiscal.get('emitente_ie', '')],
        ]
        
        # Adicionar endereço do emitente
        if nota_fiscal.get('emitente_endereco'):
            end = nota_fiscal['emitente_endereco']
            emitente_data.extend([
                ["ENDEREÇO:", f"{end.get('logradouro', '')}, {end.get('numero', '')}"],
                ["BAIRRO/DISTRITO:", end.get('bairro', '')],
                ["CEP:", end.get('cep', '')],
                ["MUNICÍPIO:", f"{end.get('cidade', '')} - {end.get('estado', '')}"],
            ])
        
        emitente_table = Table(emitente_data, colWidths=[2*inch, 4*inch])
        emitente_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(emitente_table)
        story.append(Spacer(1, 8))
        
        # 6. NATUREZA DA OPERAÇÃO E DATAS
        operacao_data = [
            ["NATUREZA DA OPERAÇÃO:", nota_fiscal.get('natureza_operacao', '')],
            ["INSCRIÇÃO ESTADUAL:", nota_fiscal.get('emitente_ie', '')],
            ["DATA DA EMISSÃO:", PDFService.format_date(nota_fiscal.get('data_emissao', ''))],
            ["DATA DA SAÍDA/ENTRADA:", PDFService.format_date(nota_fiscal.get('data_emissao', ''))],
            ["HORA DA SAÍDA/ENTRADA:", "19:38:57"],  # Exemplo
        ]
        
        operacao_table = Table(operacao_data, colWidths=[2*inch, 4*inch])
        operacao_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(operacao_table)
        story.append(Spacer(1, 8))
        
        # 7. DESTINATÁRIO/REMETENTE
        story.append(Paragraph("DESTINATÁRIO/REMETENTE", section_style))
        
        destinatario_data = [
            ["NOME/RAZÃO SOCIAL:", nota_fiscal.get('destinatario_nome', '')],
            ["CNPJ/CPF:", PDFService.format_cnpj_cpf(nota_fiscal.get('destinatario_documento', ''))],
        ]
        
        if nota_fiscal.get('destinatario_email'):
            destinatario_data.append(["EMAIL:", nota_fiscal['destinatario_email']])
        if nota_fiscal.get('destinatario_telefone'):
            destinatario_data.append(["FONE/FAX:", nota_fiscal['destinatario_telefone']])
        
        # Adicionar endereço do destinatário
        if nota_fiscal.get('destinatario_endereco'):
            end = nota_fiscal['destinatario_endereco']
            destinatario_data.extend([
                ["ENDEREÇO:", f"{end.get('logradouro', '')}, {end.get('numero', '')}"],
                ["BAIRRO/DISTRITO:", end.get('bairro', '')],
                ["CEP:", end.get('cep', '')],
                ["MUNICÍPIO:", f"{end.get('cidade', '')} - {end.get('estado', '')}"],
            ])
        
        destinatario_table = Table(destinatario_data, colWidths=[2*inch, 4*inch])
        destinatario_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(destinatario_table)
        story.append(Spacer(1, 8))
        
        # 8. CÁLCULO DO IMPOSTO
        story.append(Paragraph("CÁLCULO DO IMPOSTO", section_style))
        
        impostos_data = [
            ["BASE DE CÁLC. DO ICMS:", PDFService.format_currency(nota_fiscal.get('valor_produtos', 0))],
            ["VALOR DO ICMS:", PDFService.format_currency(nota_fiscal.get('valor_icms', 0))],
            ["BASE DE CÁLC. ICMS ST:", "0,00"],
            ["VALOR DO ICMS SUBST.:", "0,00"],
            ["VALOR DO FRETE:", PDFService.format_currency(nota_fiscal.get('valor_frete', 0))],
            ["VALOR DO SEGURO:", PDFService.format_currency(nota_fiscal.get('valor_seguro', 0))],
            ["DESCONTO:", PDFService.format_currency(nota_fiscal.get('valor_desconto', 0))],
            ["VALOR TOTAL IPI:", PDFService.format_currency(nota_fiscal.get('valor_ipi', 0))],
            ["VALOR DO PIS:", PDFService.format_currency(nota_fiscal.get('valor_pis', 0))],
            ["VALOR DA COFINS:", PDFService.format_currency(nota_fiscal.get('valor_cofins', 0))],
            ["V. TOTAL PRODUTOS:", PDFService.format_currency(nota_fiscal.get('valor_produtos', 0))],
            ["V. TOTAL DA NOTA:", PDFService.format_currency(nota_fiscal.get('valor_total', 0))],
        ]
        
        impostos_table = Table(impostos_data, colWidths=[2*inch, 2*inch])
        impostos_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(impostos_table)
        story.append(Spacer(1, 8))
        
        # 9. TRANSPORTADOR/VOLUMES
        story.append(Paragraph("TRANSPORTADOR/VOLUMES TRANSPORTADOS", section_style))
        
        transporte_data = [
            ["NOME/RAZÃO SOCIAL:", nota_fiscal.get('transportadora_nome', '')],
            ["FRETE POR CONTA:", "2 - Contratação do Frete por conta de Terceiros"],
            ["PLACA DO VEÍCULO:", nota_fiscal.get('transportadora_placa', '')],
            ["UF:", nota_fiscal.get('transportadora_uf', '')],
            ["CNPJ/CPF:", PDFService.format_cnpj_cpf(nota_fiscal.get('transportadora_cnpj', ''))],
            ["QUANTIDADE:", "1"],
            ["ESPÉCIE:", ""],
            ["MARCA:", ""],
            ["NUMERAÇÃO:", ""],
            ["PESO BRUTO:", ""],
            ["PESO LÍQUIDO:", ""],
        ]
        
        transporte_table = Table(transporte_data, colWidths=[2*inch, 4*inch])
        transporte_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(transporte_table)
        story.append(Spacer(1, 8))
        
        # 10. DADOS DOS PRODUTOS/SERVIÇOS
        story.append(Paragraph("DADOS DOS PRODUTOS/SERVIÇOS", section_style))
        
        if nota_fiscal.get('produtos') and len(nota_fiscal['produtos']) > 0:
            produtos_headers = ["CÓDIGO", "DESCRIÇÃO DO PRODUTO/SERVIÇO", "NCM", "CST/CSOSN", "CFOP", "UN", "QUANT", "VALOR UNIT.", "VALOR TOTAL", "B.CÁLC. ICMS", "VALOR ICMS", "VALOR IPI", "ALIQ. ICMS", "ALIQ. IPI"]
            produtos_data = [produtos_headers]
            
            for produto in nota_fiscal['produtos']:
                produtos_data.append([
                    produto.get('codigo', ''),
                    produto.get('descricao', ''),
                    produto.get('ncm', ''),
                    "0102",  # CST padrão
                    produto.get('cfop', ''),
                    produto.get('unidade', 'UN'),
                    str(produto.get('quantidade', '')),
                    PDFService.format_currency(produto.get('valor_unitario', 0)),
                    PDFService.format_currency(produto.get('valor_total', 0)),
                    PDFService.format_currency(produto.get('valor_unitario', 0) * produto.get('quantidade', 0)),
                    "0,00",  # Valor ICMS
                    "0,00",  # Valor IPI
                    "0,00",  # Alíquota ICMS
                    "0,00",  # Alíquota IPI
                ])
            
            produtos_table = Table(produtos_data, colWidths=[0.5*inch, 2.5*inch, 0.5*inch, 0.5*inch, 0.5*inch, 0.3*inch, 0.3*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch])
            produtos_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),  # Descrição alinhada à esquerda
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Cabeçalho em negrito
                ('FONTSIZE', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(produtos_table)
            story.append(Spacer(1, 8))
        
        # 11. DADOS ADICIONAIS
        story.append(Paragraph("DADOS ADICIONAIS", section_style))
        
        dados_adicionais_data = [
            ["INFORMAÇÕES COMPLEMENTARES:", nota_fiscal.get('informacoes_adicionais', '')],
            ["RESERVADO AO FISCO:", ""],
        ]
        
        dados_adicionais_table = Table(dados_adicionais_data, colWidths=[2*inch, 4*inch])
        dados_adicionais_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(dados_adicionais_table)
        
        # Gerar PDF
        doc.build(story)
        buffer.seek(0)
        return buffer 