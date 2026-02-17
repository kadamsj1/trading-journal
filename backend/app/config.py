from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str

    # CSRF Settings
    CSRF_TOKEN_EXPIRE_SECONDS: int = 3600
    CSRF_COOKIE_SECURE: bool = True
    CSRF_COOKIE_SAMESITE: str = "lax"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
