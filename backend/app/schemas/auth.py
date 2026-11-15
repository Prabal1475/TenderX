from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Optional[str] = "bid_manager"
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    role: str = "bid_manager"


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "bid_manager"


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


class UserResponse(UserBase):
    id: UUID
    is_superuser: bool = False
    role: str = "bid_manager"

    model_config = ConfigDict(from_attributes=True)

