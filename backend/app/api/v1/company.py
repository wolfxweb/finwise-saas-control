from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...core.security import verify_token
from ...services.auth_service import AuthService
from ...models.user import User
from ...models.company import Company
from ...schemas.company import CompanyProfile

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Obter usuário atual através do token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    auth_service = AuthService(db)
    user = auth_service.get_current_user(user_id)
    if user is None:
        raise credentials_exception
    
    return user

@router.get("/profile", response_model=CompanyProfile)
def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter perfil da empresa do usuário atual"""
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    return CompanyProfile(
        id=str(company.id),
        name=company.name,
        corporate_name=company.corporate_name,
        cnpj=company.cnpj,
        email=company.email,
        phone=company.phone,
        address=company.address,
        city=company.city,
        state=company.state,
        zip_code=company.zip_code,
        status=company.status,
        plan_type=company.plan_type,
        created_at=company.created_at.isoformat(),
        updated_at=company.updated_at.isoformat() if company.updated_at else None
    ) 