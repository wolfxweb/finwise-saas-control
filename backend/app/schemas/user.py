from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "user"

class UserCreate(UserBase):
    password: str
    company_id: UUID
    branch_id: Optional[UUID] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[UUID] = None
    status: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class User(UserBase):
    id: UUID
    company_id: UUID
    branch_id: Optional[UUID] = None
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    permissions: List[str] = []
    modules: List[str] = []

class PermissionBase(BaseModel):
    name: str
    code: str
    module_id: UUID
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UserPermissionBase(BaseModel):
    user_id: UUID
    permission_id: UUID
    granted: bool = True

class UserPermissionCreate(UserPermissionBase):
    pass

class UserPermission(UserPermissionBase):
    id: UUID
    created_at: datetime
    permission: Permission

    class Config:
        from_attributes = True

class UserWithPermissions(User):
    permissions: List[UserPermission] = []

class UserWithCompany(User):
    company_name: Optional[str] = None
    permissions: List[str] = []
    modules: List[str] = [] 