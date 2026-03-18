import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.config import get_settings

async def init_db():
    settings = get_settings()
    url = settings.get_database_url
    
    print(f"Connecting to: {url.split('@')[-1]}") # Only show host for security
    
    engine = create_async_engine(
        url,
        echo=True,
        connect_args={"ssl": "require"} if url.startswith("postgresql") else {}
    )
    
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
