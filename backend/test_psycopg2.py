import psycopg2
import sys

def test():
    conn_str = "postgresql://postgres:9w!rE@Yk&dt0R!#dbCqv@db.qvqyfadupyxcpbtoovmt.supabase.co:5432/postgres"
    print(f"Connecting with psycopg2...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=5)
        print("SUCCESS!")
        conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test()
