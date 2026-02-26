from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

import os

settings = get_settings()

# Connection arguments
connect_args = {}
if settings.get_database_url.startswith("postgresql"):
    # Supabase/PostgreSQL often require SSL
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.get_database_url,
    echo=True,
    future=True,
    connect_args=connect_args if connect_args else {}
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    # Skip automatic table creation on Vercel to save resources and avoid read-only issues
    if os.getenv("VERCEL"):
        print("Vercel environment detected. Skipping automatic init_db.")
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
