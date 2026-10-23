import os
import resend
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("MAIL_PASSWORD")

def send_verification_email(email: EmailStr, token: str):
    link = f"http://localhost:3000/verify-email?token={token}"

    html = f"""
    <!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email Address</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; margin: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333;">Welcome to Ascend.AI!</h2>
        <p style="color: #666;">Thank you for signing up. Please click the link below to verify your email address and activate your account.</p>
        
        <a href="{link}" style="display: inline-block; background-color: #6259ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Verify Email
        </a>
        
        <p style="color: #666;">If you did not create this account, please ignore this email.</p>
        <p style="color: #666;">Best regards,<br>The Ascend.AI Team</p>
    </div>
</body>
</html>
    """

    params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",
        "to": [str(email)],
        "subject": "Verify your Ascend.ai account",
        "html": html,
    }
    
    resend.Emails.send(params)


def send_reset_password_email(email: EmailStr, token: str):
    link = f"http://localhost:3000/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; margin: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #666;">We received a request to reset the password for your account. Please click the link below to set a new password.</p>
        
        <a href="{link}" style="display: inline-block; background-color: #6259ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
        </a>
        
        <p style="color: #666;">If you did not request a password reset, please ignore this email.</p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666;">Best regards,<br>The Ascend.AI Team</p>
    </div>
</body>
</html>
    """

    params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",
        "to": [str(email)],
        "subject": "Reset your Ascend.ai password",
        "html": html,
    }

    resend.Emails.send(params)