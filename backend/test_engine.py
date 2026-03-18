import asyncio
import os
import sys

# Add current dir to sys.path
sys.path.append(os.getcwd())

from app.database import engine

async def test_engine():
    print("Testing SQLAlchemy Engine connection...")
    try:
        async with engine.connect() as conn:
            print("Engine connect branch SUCCESS")
            await conn.execute("SELECT 1")
            print("Query execution SUCCESS")
    except Exception as e:
        print(f"Engine connection FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_engine())
