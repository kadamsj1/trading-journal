from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets
import os


class Settings(BaseSettings):
    # Generate a random key if not provided (fine for testing; set in prod!)
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h default

    # SQLite path works on Railway with /app/data volume
    DATABASE_URL: str = "sqlite+aiosqlite:////app/data/trade_journal.db"

    # CSRF Settings
    CSRF_TOKEN_EXPIRE_SECONDS: int = 3600
    CSRF_COOKIE_SECURE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    CSRF_COOKIE_SAMESITE: str = "lax"
    CSRF_ENABLED: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings():
    return Settings()
