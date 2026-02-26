import asyncio
import asyncpg

async def test():
    project_ref = "qvqyfadupyxcpbtoovmt"
    password = '9w!rE@Yk&dt0R!#dbCqv'
    user = f"postgres.{project_ref}"
    regions = ["ap-south-1", "us-east-1", "ap-southeast-1"]
    
    for region in regions:
        host = f"aws-0-{region}.pooler.supabase.com"
        for port in [5432, 6543]:
            print(f"Testing {host}:{port}...")
            try:
                conn = await asyncpg.connect(
                    user=user,
                    password=password,
                    database='postgres',
                    host=host,
                    port=port,
                    timeout=5
                )
                print(f"SUCCESS! {host}:{port}")
                await conn.close()
                return
            except Exception as e:
                print(f"FAILED {port}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
