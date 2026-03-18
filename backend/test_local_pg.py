import asyncio
import asyncpg

async def test_local_pg():
    try:
        # Try to connect to 'postgres' first to see if credentials are correct
        conn = await asyncpg.connect(user='hospitech360', password='hospitech360', database='postgres', host='localhost')
        print("SUCCESS: Connected to 'postgres' database with hospitech360 credentials.")
        await conn.close()
        
        # Now try to connect to 'trading_journal'
        try:
            conn = await asyncpg.connect(user='hospitech360', password='hospitech360', database='trading_journal', host='localhost')
            print("SUCCESS: Connected to 'trading_journal' database.")
            await conn.close()
        except Exception as e:
            print(f"FAILED to connect to 'trading_journal': {e}")
            print("Attempting to create 'trading_journal' database...")
            # We already have create_pg_db.py, but let's do it here
            conn = await asyncpg.connect(user='hospitech360', password='hospitech360', database='postgres', host='localhost')
            await conn.execute('CREATE DATABASE trading_journal')
            await conn.close()
            print("Database 'trading_journal' created successfully!")
            
    except Exception as e:
        print(f"FAILED to connect with hospitech360 credentials: {e}")

if __name__ == "__main__":
    asyncio.run(test_local_pg())
