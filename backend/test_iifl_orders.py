import httpx
import asyncio
import sqlite3

async def test_fetch_orders():
    client_id = "30295299"
    conn = sqlite3.connect('d:/github/trading-journal/backend/trade_journal.db')
    cursor = conn.cursor()
    cursor.execute("SELECT api_key, access_token FROM brokers WHERE client_id = ?", (client_id,))
    res = cursor.fetchone()
    conn.close()
    
    if not res or not res[1]:
        print("Broker or access token not found")
        return
        
    api_key, access_token = res
    print(f"Using Access Token: {access_token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    url = "https://api.iiflcapital.com/v1/trades"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Raw Response: {data}")
            
            if isinstance(data, list):
                print(f"Response is a list of {len(data)} items")
            elif isinstance(data, dict):
                print("Response is a dict")
                result = data.get("result", [])
                print(f"Result type: {type(result)}")
                if isinstance(result, list):
                    print(f"Result has {len(result)} items")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_fetch_orders())
