import psycopg2
import urllib.parse

def test():
    # Use the encoded password
    user = "postgres"
    password = urllib.parse.quote_plus("9w!rE@Yk&dt0R!#dbCqv")
    host = "db.qvqyfadupyxcpbtoovmt.supabase.co"
    port = "5432"
    dbname = "postgres"
    
    conn_str = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    print(f"Connecting to {host} with encoded password...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=10)
        print("SUCCESS!")
        conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test()
