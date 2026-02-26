import asyncpg
import asyncio

async def create_db():
    try:
        # Connect to default 'postgres' database to create the new one
        conn = await asyncpg.connect(user='hospitech360', password='hospitech360', host='localhost')
        await conn.execute('CREATE DATABASE trading_journal')
        await conn.close()
        print("Database 'trading_journal' created successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_db())
