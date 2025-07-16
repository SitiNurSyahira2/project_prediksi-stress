from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    nama: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    nama: str
    email: str
    
class AuthResponse(BaseModel):
    message: str
    data: UserResponse
    access_token: Optional[str] = None
