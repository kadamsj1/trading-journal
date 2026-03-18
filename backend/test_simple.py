import asyncio
import asyncpg
import os
import sys

# Add the current directory to sys.path so 'app' can be found
sys.path.append(os.getcwd())

from app.config import get_settings

async def test_conn():
    settings = get_settings()
    url = settings.get_database_url
    print(f"Testing connection to: {url}")
    try:
        # Use a short timeout
        conn = await asyncpg.connect(url, timeout=10)
        print("SUCCESS! Connected to Database.")
        await conn.close()
    except Exception as e:
        print(f"FAILED to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
