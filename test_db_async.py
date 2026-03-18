import asyncio
import asyncpg
from app.config import get_settings

async def test_conn():
    settings = get_settings()
    url = settings.get_database_url
    print(f"Testing connection to: {url}")
    try:
        conn = await asyncpg.connect(url, timeout=10)
        print("SUCCESS!")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    import os
    import sys
    # The script is in the root, and app is inside backend folder
    # If running from backend dir:
    current_dir = os.getcwd()
    if os.path.basename(current_dir) == 'backend':
        sys.path.append(current_dir)
    else:
        sys.path.append(os.path.join(current_dir, 'backend'))
    
    asyncio.run(test_conn())
