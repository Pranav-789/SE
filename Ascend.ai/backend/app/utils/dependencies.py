import jwt
import os
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models.User import UserModel

async def verify_access_token(request: Request, db: AsyncSession=Depends(get_db)):
    access_token = request.cookies.get('access_token')

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token not found!"
        )
    
    try:
        payload = jwt.decode(access_token, os.getenv('SECRET_KEY'), os.getenv('ALGORITHM'))

        user_id: str = payload.get("_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token!"
            )
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired!"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token!"
        )    

    from app.main import db as app_db
    redis_client = app_db.get('redis')
    if redis_client:
        is_blacklisted = await redis_client.get(f"blacklist:{access_token}")
        if is_blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has been revoked!"
            )

    stmt = select(UserModel.id, UserModel.email, UserModel.username).where(UserModel.id == user_id)
    res = await db.execute(stmt)
    
    user = res.mappings().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The account with the given email does not exist"
        )

    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"]
    }

    