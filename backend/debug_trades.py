import sqlite3
import os

db_path = 'd:/github/trading-journal/backend/trade_journal.db'
if not os.path.exists(db_path):
    print("DB not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, symbol, quantity, entry_price, broker_trade_id, status FROM trades WHERE symbol LIKE "SENSEX 82100 PE%"')
    rows = cursor.fetchall()
    print("--- SENSEX 82100 PE Trades ---")
    for r in rows:
        print(r)
        
    cursor.execute('SELECT id, symbol, quantity, entry_price, broker_trade_id, status FROM trades WHERE symbol LIKE "SENSEX 82200 PE%"')
    rows = cursor.fetchall()
    print("\n--- SENSEX 82200 PE Trades ---")
    for r in rows:
        print(r)
    conn.close()
