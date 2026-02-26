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
    # Default to local SQLite if not provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./trade_journal.db")

    # CSRF Settings
    CSRF_TOKEN_EXPIRE_SECONDS: int = 3600
    CSRF_COOKIE_SECURE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    CSRF_COOKIE_SAMESITE: str = "lax"
    CSRF_ENABLED: bool = True

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
