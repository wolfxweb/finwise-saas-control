from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from ..v1.auth import get_current_user
from app.models.user import User
from app.schemas.nota_fiscal import (
    NotaFiscal, NotaFiscalCreate, NotaFiscalUpdate, 
    NotaFiscalList, NotaFiscalImport, NotaFiscalResponse
)
from app.services.nota_fiscal_service import NotaFiscalService
from app.services.pdf_service import PDFService

router = APIRouter()


@router.post("/import", response_model=NotaFiscalResponse)
def import_nota_fiscal(
    import_data: NotaFiscalImport,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Importa nota fiscal a partir de XML"""
    try:
        print(f"DEBUG: Importando nota fiscal para usuário: {current_user.email}")
        print(f"DEBUG: Company ID: {current_user.company_id}")
        print(f"DEBUG: XML filename: {import_data.xml_filename}")
        print(f"DEBUG: Tipo: {import_data.tipo}")
        print(f"DEBUG: Origem: {import_data.origem}")
        
        # Usar company_id do usuário logado
        import_data.company_id = current_user.company_id
        
        nota_fiscal = NotaFiscalService.import_xml_nota_fiscal(db, import_data)
        
        return NotaFiscalResponse(
            success=True,
            message="Nota fiscal importada com sucesso",
            data=nota_fiscal
        )
    except ValueError as e:
        print(f"DEBUG: Erro ValueError: {str(e)}")
        return NotaFiscalResponse(
            success=False,
            message="Erro ao importar nota fiscal",
            errors=[str(e)]
        )
    except Exception as e:
        print(f"DEBUG: Erro Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return NotaFiscalResponse(
            success=False,
            message="Erro interno do servidor",
            errors=[str(e)]
        )


@router.post("/", response_model=NotaFiscal)
def create_nota_fiscal(
    nota_fiscal_data: NotaFiscalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova nota fiscal"""
    try:
        # Usar company_id do usuário logado
        nota_fiscal_data.company_id = current_user.company_id
        
        return NotaFiscalService.create_nota_fiscal(db, nota_fiscal_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[NotaFiscalList])
def list_notas_fiscais(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista TODAS as notas fiscais da empresa (sem limite)"""
    notas_fiscais = NotaFiscalService.get_all_notas_fiscais(
        db, current_user.company_id
    )
    return notas_fiscais


@router.get("/{nota_fiscal_id}", response_model=NotaFiscal)
def get_nota_fiscal(
    nota_fiscal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca uma nota fiscal específica"""
    nota_fiscal = NotaFiscalService.get_nota_fiscal(
        db, nota_fiscal_id, current_user.company_id
    )
    if not nota_fiscal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )
    return nota_fiscal


@router.put("/{nota_fiscal_id}", response_model=NotaFiscal)
def update_nota_fiscal(
    nota_fiscal_id: int,
    update_data: NotaFiscalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma nota fiscal"""
    nota_fiscal = NotaFiscalService.update_nota_fiscal(
        db, nota_fiscal_id, current_user.company_id, update_data
    )
    if not nota_fiscal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )
    return nota_fiscal


@router.delete("/{nota_fiscal_id}")
def delete_nota_fiscal(
    nota_fiscal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deleta uma nota fiscal"""
    success = NotaFiscalService.delete_nota_fiscal(
        db, nota_fiscal_id, current_user.company_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )
    return {"message": "Nota fiscal deletada com sucesso"}


@router.get("/check-exists")
def check_nota_fiscal_exists(
    numero: str,
    emitente_cnpj: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifica se já existe uma nota fiscal com o mesmo número e emitente"""
    exists = NotaFiscalService.check_nota_fiscal_exists(
        db, numero, emitente_cnpj, current_user.company_id
    )
    
    return {
        "exists": exists,
        "numero": numero,
        "emitente_cnpj": emitente_cnpj
    }


@router.get("/{nota_fiscal_id}/xml")
def download_xml_nota_fiscal(
    nota_fiscal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download do XML da nota fiscal"""
    nota_fiscal = NotaFiscalService.get_nota_fiscal(
        db, nota_fiscal_id, current_user.company_id
    )
    if not nota_fiscal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )
    
    if not nota_fiscal.xml_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="XML não disponível para esta nota fiscal"
        )
    
    filename = nota_fiscal.xml_filename or f"nfe_{nota_fiscal.numero}.xml"
    
    from fastapi.responses import Response
    return Response(
        content=nota_fiscal.xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{nota_fiscal_id}/pdf")
def download_pdf_nota_fiscal(
    nota_fiscal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download do PDF da nota fiscal"""
    nota_fiscal = NotaFiscalService.get_nota_fiscal(
        db, nota_fiscal_id, current_user.company_id
    )
    if not nota_fiscal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )
    
    # Converter para dict para o PDF service
    nota_fiscal_dict = {
        'numero': nota_fiscal.numero,
        'serie': nota_fiscal.serie,
        'tipo': nota_fiscal.tipo,
        'natureza_operacao': nota_fiscal.natureza_operacao,
        'data_emissao': nota_fiscal.data_emissao,
        'emitente_nome': nota_fiscal.emitente_nome,
        'emitente_cnpj': nota_fiscal.emitente_cnpj,
        'emitente_ie': nota_fiscal.emitente_ie,
        'emitente_endereco': nota_fiscal.emitente_endereco,
        'destinatario_nome': nota_fiscal.destinatario_nome,
        'destinatario_documento': nota_fiscal.destinatario_documento,
        'destinatario_email': nota_fiscal.destinatario_email,
        'destinatario_telefone': nota_fiscal.destinatario_telefone,
        'destinatario_endereco': nota_fiscal.destinatario_endereco,
        'valor_total': nota_fiscal.valor_total,
        'valor_produtos': nota_fiscal.valor_produtos,
        'valor_icms': nota_fiscal.valor_icms,
        'valor_ipi': nota_fiscal.valor_ipi,
        'valor_pis': nota_fiscal.valor_pis,
        'valor_cofins': nota_fiscal.valor_cofins,
        'valor_frete': nota_fiscal.valor_frete,
        'valor_seguro': nota_fiscal.valor_seguro,
        'valor_desconto': nota_fiscal.valor_desconto,
        'observacoes': nota_fiscal.observacoes,
        'informacoes_adicionais': nota_fiscal.informacoes_adicionais,
        'produtos': [
            {
                'codigo': p.codigo,
                'descricao': p.descricao,
                'ncm': p.ncm,
                'cfop': p.cfop,
                'unidade': p.unidade,
                'quantidade': p.quantidade,
                'valor_unitario': p.valor_unitario,
                'valor_total': p.valor_total,
            } for p in nota_fiscal.produtos
        ] if nota_fiscal.produtos else []
    }
    
    # Gerar PDF
    pdf_buffer = PDFService.generate_nota_fiscal_pdf(nota_fiscal_dict)
    pdf_content = pdf_buffer.getvalue()
    
    filename = f"nfe_{nota_fiscal.numero}.pdf"
    
    from fastapi.responses import Response
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    ) 