from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets
import os


class Settings(BaseSettings):
    # Generate a random key if not provided (fine for testing; set in prod!)
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h default

    # Database URL configuration
    # 1. Use Vercel Postgres URL if available
    # 2. Fall back to standard DATABASE_URL
    # 3. Default to local SQLite
    DATABASE_URL: str = os.getenv("POSTGRES_URL", os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./trade_journal.db"))

    # CSRF Settings
    CSRF_TOKEN_EXPIRE_SECONDS: int = 3600
    CSRF_COOKIE_SECURE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    CSRF_COOKIE_SAMESITE: str = "lax"
    CSRF_ENABLED: bool = True

    # SMTP Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Smart Journal")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Upload Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads/screenshots")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def get_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache()
def get_settings():
    return Settings()
