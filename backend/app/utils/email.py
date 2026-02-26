import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

async def send_reset_password_email(email_to: str, token: str, username: str):
    """
    Sends a password reset email using SMTP.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"\n[SKIP EMAIL] SMTP credentials not set. Reset Link:")
        print(f"{settings.FRONTEND_URL}/reset-password?token={token}\n")
        return False

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = f"Password Reset for {settings.SMTP_FROM_NAME}"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    message["To"] = email_to

    # HTML Content
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>Hello {username},</p>
            <p>Recently you requested to reset your password for your Trading Journal account. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email. This link will expire in 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #777;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #777;">{reset_link}</p>
        </div>
    </body>
    </html>
    """
    
    message.attach(MIMEText(html, "html"))

    try:
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, email_to, message.as_string())
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        print(f"SMTP Error: {str(e)}")
        return False
