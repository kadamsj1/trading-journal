import asyncio
import asyncpg
import urllib.parse

async def test():
    user = 'postgres'
    password = '9w!rE@Yk&dt0R!#dbCqv'
    host = 'db.qvqyfadupyxcpbtoovmt.supabase.co'
    port = 5432
    database = 'postgres'
    
    print(f"Connecting to {host}...")
    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database=database,
            host=host,
            port=port,
            timeout=10
        )
        print("SUCCESS: Connected to Supabase!")
        await conn.close()
    except Exception as e:
        import traceback
        print(f"FAILED: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
