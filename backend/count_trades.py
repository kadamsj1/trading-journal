import sqlite3

def count_trades():
    try:
        conn = sqlite3.connect('trade_journal.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM trades")
        count = cursor.fetchone()[0]
        
        print(f"TOTAL_TRADES_IN_DB: {count}")
        
        # Also check breakdown by portfolio
        cursor.execute("SELECT portfolio_id, COUNT(*) FROM trades GROUP BY portfolio_id")
        portfolios = cursor.fetchall()
        for p in portfolios:
            print(f"Portfolio ID {p[0]}: {p[1]} trades")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    count_trades()
