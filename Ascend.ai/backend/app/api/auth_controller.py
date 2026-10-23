from app.utils.mail import send_reset_password_email
from pydantic import EmailStr
from app.utils.mail import send_verification_email
from app.schemas.requests import RegisterRequest, LoginRequest
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.User import UserModel
from app.db.models.Session import UserSession
from fastapi import HTTPException, status, Request, BackgroundTasks
from app.schemas.response import RegisterUserResponse
from sqlalchemy import select 
from datetime import datetime, timedelta, timezone
import bcrypt
import os
from dotenv import load_dotenv
import jwt

load_dotenv()

def create_email_token(user_id: str, minutes: int):
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)

    return jwt.encode(
        payload={"_id": str(user_id), "exp": expire},
        algorithm=os.getenv('ALGORITHM'),
        key=os.getenv('SECRET_KEY'),   
    )

async def register_user(body: RegisterRequest, db: AsyncSession, background_tasks: BackgroundTasks):
    user_exisits_stmt = select(UserModel).where(UserModel.username == body.username)
    user_exisits_result = await db.execute(user_exisits_stmt)

    if user_exisits_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail = 'Username already exists'
        )
    
    email_stmt = select(UserModel).where(UserModel.email == body.email)
    email_result = await db.execute(email_stmt)

    if email_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail = 'Email already exists'
        )
    
    hashed_pw = bcrypt.hashpw(password=body.password.encode('utf-8'), salt=bcrypt.gensalt()).decode('utf-8')
    
    new_user = UserModel(
        username=body.username,
        hashed_password=hashed_pw,
        email=body.email,
        is_verified=True,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return RegisterUserResponse.model_validate(new_user)

async def verify_email(token: str, db: AsyncSession):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), os.getenv('ALGORITHM'))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired!")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token!")

    user_id = payload.get("_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token!")
    
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found!")
    
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified!")

    user.is_verified = True
    await db.commit()
    
    return {"message": "Email verified successfully!"}

async def resend_verification_email(email: EmailStr, db: AsyncSession, background_tasks: BackgroundTasks):
    
    stmt = select(UserModel).where(UserModel.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found!")
    
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified!")
    
    token = create_email_token(user_id=user.id, minutes=15)
    
    background_tasks.add_task(send_verification_email, user.email, token)
    
    return {"message": "Verification email resent successfully!"}

async def request_password_reset(email: EmailStr, db: AsyncSession, background_tasks: BackgroundTasks):
    stmt = select(UserModel).where(UserModel.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found!")

    token = create_email_token(user_id=user.id, minutes=15)

    background_tasks.add_task(send_reset_password_email, user.email, token)
    
    return {"message": "Password reset email sent successfully!"}

async def reset_password(token: str, new_password: str, db: AsyncSession):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=os.getenv('ALGORITHM'))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired!")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token!")

    user_id = payload.get("_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token!")
    
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found!")

    
    user.hashed_password = bcrypt.hashpw(password=new_password.encode('utf-8'), salt=bcrypt.gensalt()).decode('utf-8')
    await db.commit()
    await db.refresh(user)
    
    return {"message": "Password reset successful!"}

async def login_user(body: LoginRequest, client_ip: str, user_agent: str, db: AsyncSession):
    user_stmt = select(UserModel).where(UserModel.email == body.email)
    user_res = await db.execute(user_stmt)

    user_data = user_res.scalars().first()

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The account with the given email does not exist"
        )

    if not user_data.is_verified:
        user_data.is_verified = True
        await db.commit()

    password_verf: bool = bcrypt.checkpw(body.password.encode('utf-8'), user_data.hashed_password.encode('utf-8'))

    if not password_verf:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is invalid!, please try again"
        )
    
    now_utc = datetime.now(timezone.utc)
    access_expiry = now_utc + timedelta(minutes=15)
    refresh_expiry = now_utc + timedelta(hours=6)
    
    user_id_str = str(user_data.id)

    access_token = jwt.encode(
        payload={"_id": user_id_str, "exp": access_expiry},
        algorithm=os.getenv('ALGORITHM'),
        key=os.getenv('SECRET_KEY'),   
    )

    refresh_token = jwt.encode(
        payload={"_id": user_id_str, "exp": refresh_expiry},
        algorithm=os.getenv('ALGORITHM'),
        key=os.getenv('SECRET_KEY'),   
    )
    
    new_session = UserSession(
        user_id=user_data.id,
        last_ip=client_ip,
        user_agent=user_agent,
        refresh_token=refresh_token,
        refresh_token_expiry=datetime.now() + timedelta(minutes=15)
    )

    db.add(new_session)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


async def refresh_access_token(request: Request, client_ip: str, user_agent: str, db:AsyncSession):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found!"
        )

    try:
        payload = jwt.decode(refresh_token, os.getenv('SECRET_KEY'), os.getenv('ALGORITHM'))

        user_id: str = payload.get("_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token!"
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired!"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token!"
        )    

    stmt = select(UserSession).where(
        UserSession.user_id == user_id,
        UserSession.refresh_token == refresh_token
    )

    result = await db.execute(stmt)

    existing_session = result.scalars().first()

    if not existing_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token!"
        )
    
    now_utc = datetime.now(timezone.utc)
    access_expiry = now_utc + timedelta(minutes=15)
    refresh_expiry = now_utc + timedelta(hours=6)

    new_access_token = jwt.encode(
        payload={"_id": user_id, "exp": access_expiry},
        algorithm=os.getenv('ALGORITHM'),
        key=os.getenv('SECRET_KEY'),   
    )

    new_refresh_token = jwt.encode(
        payload={"_id": user_id, "exp": refresh_expiry},
        algorithm=os.getenv('ALGORITHM'),
        key=os.getenv('SECRET_KEY'),   
    )

    existing_session.refresh_token = new_refresh_token
    existing_session.refresh_token_expiry = refresh_expiry.replace(tzinfo=None)
    existing_session.last_ip = client_ip 
    existing_session.user_agent = user_agent
    
    await db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }

async def logout_user(request: Request, db: AsyncSession):
    refresh_token = request.cookies.get("refresh_token")
    access_token = request.cookies.get("access_token")

    # 1. Remove refresh token from database
    if refresh_token:
        stmt = select(UserSession).where(UserSession.refresh_token == refresh_token)
        result = await db.execute(stmt)
        session_to_delete = result.scalars().first()
        if session_to_delete:
            await db.delete(session_to_delete)
            await db.commit()

    if access_token:
        from app.main import db as app_db
        redis_client = app_db.get('redis')
        if redis_client:
            try:
                await redis_client.setex(f"blacklist:{access_token}", 900, "true")
            except Exception as e:
                print(f"Redis error during token blacklisting: {e}")

    return {"message": "Logout successful and tokens blacklisted."}