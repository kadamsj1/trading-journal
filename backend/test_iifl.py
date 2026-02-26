import httpx
import hashlib
import asyncio

async def test_iifl_session():
    client_id = "30295299"
    auth_code = "4GBQZ07NPJJ6LT3LG4CD"
    # I need the api_secret from the DB
    import sqlite3
    conn = sqlite3.connect('d:/github/trading-journal/backend/trade_journal.db')
    cursor = conn.cursor()
    cursor.execute("SELECT api_secret FROM brokers WHERE client_id = ?", (client_id,))
    res = cursor.fetchone()
    conn.close()
    
    if not res:
        print("Broker not found in DB")
        return
        
    api_secret = res[0]
    print(f"Using API Secret: {api_secret[:4]}...")
    
    raw_string = f"{client_id}{auth_code}{api_secret}"
    checksum = hashlib.sha256(raw_string.encode()).hexdigest()
    
    url = "https://api.iiflcapital.com/v1/getusersession"
    payload = {"checkSum": checksum}
    
    print(f"Requesting: {url}")
    print(f"Payload: {payload}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_iifl_session())
