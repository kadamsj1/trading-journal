import asyncio
import asyncpg

async def test():
    project_ref = "qvqyfadupyxcpbtoovmt"
    password = '9w!rE@Yk&dt0R!#dbCqv'
    
    regions = ["ap-south-1", "us-east-1", "ap-southeast-1", "eu-central-1", "us-west-2", "eu-west-1"]
    
    for region in regions:
        host = f"aws-0-{region}.pooler.supabase.com"
        user = f"postgres.{project_ref}"
        
        print(f"Testing connectivity to {host}...")
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                database='postgres',
                host=host,
                port=5432,
                timeout=5
            )
            print(f"SUCCESS! Connected to {host}")
            await conn.close()
            return
        except Exception as e:
            print(f"FAILED {host}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
