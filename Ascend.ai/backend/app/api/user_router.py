from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.dependencies import verify_access_token
from app.db.database import get_db
userrouter = APIRouter(prefix="/users")

@userrouter.get("/me")
async def get_profile(user: dict = Depends(verify_access_token)):
    return user

