from fastapi import APIRouter, HTTPException, Depends, status, Response, Request, BackgroundTasks
from app.schemas.requests import RegisterRequest, LoginRequest, EmailRequest, ResetPasswordRequest
from app.schemas.response import RegisterUserResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.auth_controller import (
    register_user, login_user, refresh_access_token,
    verify_email, resend_verification_email,
    request_password_reset, reset_password, logout_user
)
from app.db.database import get_db

authrouter = APIRouter(prefix='/auth')

@authrouter.post('/register', response_model=RegisterUserResponse, status_code=status.HTTP_201_CREATED)
async def registerUser(registerRequest: RegisterRequest, background_tasks: BackgroundTasks, db: AsyncSession=Depends(get_db)):
    return await register_user(registerRequest, db, background_tasks)

@authrouter.post('/login', status_code=status.HTTP_200_OK)
async def loginUser(
    loginRequest: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession=Depends(get_db)
):
    # Check if we are behind a proxy (Render/AWS/Nginx)
    forwarded_for = request.headers.get("X-Forwarded-For")
    
    if forwarded_for:
        # The header can contain multiple IPs if it passed through multiple proxies.
        # The first IP is the original client.
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        # Fallback to direct connection IP (useful for local development)
        client_ip = request.client.host if request.client else "unknown"

    user_agent = request.headers.get("User-Agent")
    token_data = await login_user(loginRequest, client_ip, user_agent, db)

    response.set_cookie("access_token", value=token_data['access_token'], httponly=True, max_age=900)
    response.set_cookie("refresh_token", value=token_data['refresh_token'], httponly=True, max_age=21600)

    return {
        "message": "Login Successful!"
    }

@authrouter.post('/refresh')
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession=Depends(get_db)
):
    forwarded_for = request.headers.get("X-Forwarded-For")
    
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    user_agent = request.headers.get("User-Agent")
    token_data = await refresh_access_token(request, client_ip, user_agent, db)

    response.set_cookie("access_token", value=token_data['access_token'], httponly=True, max_age=900)
    response.set_cookie("refresh_token", value=token_data['refresh_token'], httponly=True, max_age=21600)

    return {
        "message": "Token Refreshed Successfully!"
    }

@authrouter.get('/verify-email')
async def verifyUserEmail(token: str, db: AsyncSession=Depends(get_db)):
    return await verify_email(token, db)

@authrouter.post('/resend-verification-email')
async def resendVerificationEmail(emailRequest: EmailRequest, background_tasks: BackgroundTasks, db: AsyncSession=Depends(get_db)):
    return await resend_verification_email(emailRequest.email, db, background_tasks)

@authrouter.post('/request-password-reset')
async def requestPasswordReset(emailRequest: EmailRequest, background_tasks: BackgroundTasks, db: AsyncSession=Depends(get_db)):
    return await request_password_reset(emailRequest.email, db, background_tasks)

@authrouter.post('/reset-password')
async def resetPassword(resetRequest: ResetPasswordRequest, db: AsyncSession=Depends(get_db)):
    return await reset_password(resetRequest.token, resetRequest.new_password, db)

@authrouter.post('/logout')
async def logoutUser(request: Request, response: Response, db: AsyncSession=Depends(get_db)):
    await logout_user(request, db)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logout Successful!"}