import sqlite3

def fix_portfolio():
    try:
        conn = sqlite3.connect('trade_journal.db')
        cursor = conn.cursor()
        
        # Check if portfolio exists
        cursor.execute("SELECT COUNT(*) FROM portfolios")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("Creating default portfolio for User ID 1...")
            cursor.execute("""
                INSERT INTO portfolios (name, description, initial_balance, user_id, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            """, ("Default Portfolio", "System generated portfolio", 100000.0, 1))
            conn.commit()
            print("Successfully created portfolio.")
        else:
            print(f"Database already has {count} portfolio(s).")
            cursor.execute("SELECT id, name, user_id FROM portfolios")
            for p in cursor.fetchall():
                print(f"Portfolio ID: {p[0]}, Name: {p[1]}, Owner ID: {p[2]}")
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_portfolio()
