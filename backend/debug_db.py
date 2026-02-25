import sqlite3
import json

def check_db():
    try:
        conn = sqlite3.connect('trade_journal.db')
        cursor = conn.cursor()
        
        print("--- Users ---")
        cursor.execute("SELECT id, email, username FROM users")
        users = cursor.fetchall()
        for u in users:
            print(f"ID: {u[0]}, Email: {u[1]}, Username: {u[2]}")
            
        print("\n--- Portfolios ---")
        cursor.execute("SELECT id, name, user_id FROM portfolios")
        portfolios = cursor.fetchall()
        for p in portfolios:
            print(f"ID: {p[0]}, Name: {p[1]}, User ID: {p[2]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
