import asyncio
import asyncpg

async def check_data():
    try:
        conn = await asyncpg.connect(user='hospitech360', password='hospitech360', database='trading_journal', host='localhost')
        users = await conn.fetch('SELECT * FROM users')
        print(f"Users in local PG: {len(users)}")
        
        try:
            portfolios = await conn.fetch('SELECT count(*) FROM portfolios')
            print(f"Portfolios in local PG: {portfolios[0][0]}")
        except:
            print("Portfolios table not found")
            
        try:
            trades = await conn.fetch('SELECT count(*) FROM trades')
            print(f"Trades in local PG: {trades[0][0]}")
        except:
            print("Trades table not found")
            
        await conn.close()
    except Exception as e:
        print(f"Error checking data: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
