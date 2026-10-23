from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal

class RegisterRequest(BaseModel):
    username: str = Field(description="The unique username assigned to and given by user, to uniquely identify them")
    email: EmailStr = Field(description="User's email address")
    password: str = Field(min_length=8, max_length=20, description="password for protecting access")


class LoginRequest(BaseModel):
    email: EmailStr = Field(description="User's email address")
    password: str = Field(min_length=8, max_length=20, description="password for protecting access")

class EmailRequest(BaseModel):
    email: EmailStr = Field(description="User's email address")

class ResetPasswordRequest(BaseModel):
    token: str = Field(description="Reset password token")
    new_password: str = Field(min_length=8, max_length=20, description="New password")