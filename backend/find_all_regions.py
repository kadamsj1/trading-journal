import asyncio
import asyncpg

async def test():
    project_ref = "qvqyfadupyxcpbtoovmt"
    password = '9w!rE@Yk&dt0R!#dbCqv'
    
    regions = [
        "us-east-1", "us-east-2", "us-west-1", "us-west-2",
        "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
        "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1", "eu-central-2",
        "sa-east-1", "ca-central-1", "me-central-1", "af-south-1"
    ]
    
    for region in regions:
        host = f"aws-0-{region}.pooler.supabase.com"
        user = f"postgres.{project_ref}"
        
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                database='postgres',
                host=host,
                port=5432,
                timeout=2
            )
            print(f"FOUND! Region: {region}")
            await conn.close()
            return
        except Exception as e:
            if "Tenant or user not found" not in str(e):
                # If it's a timeout or something else, it might still be the right region but we have network issues
                print(f"Interesting error for {region}: {e}")
            pass

if __name__ == "__main__":
    asyncio.run(test())
