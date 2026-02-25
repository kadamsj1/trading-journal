import asyncio
import sqlite3
import os

async def migrate():
    db_path = "trade_journal.db"
    if not os.path.exists(db_path):
        print("Database not found. Skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Running migration: Adding brokers table and broker_trade_id to trades...")

    try:
        # 1. Create brokers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS brokers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                broker_name TEXT NOT NULL,
                client_id TEXT,
                api_key TEXT,
                api_secret TEXT,
                access_token TEXT,
                refresh_token TEXT,
                token_expiry DATETIME,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        print("✅ Created 'brokers' table.")

        # 2. Add broker_trade_id to trades table
        try:
            cursor.execute("ALTER TABLE trades ADD COLUMN broker_trade_id TEXT")
            print("✅ Added 'broker_trade_id' column to 'trades'.")
        except sqlite3.OperationalError:
            print("ℹ️ Column 'broker_trade_id' already exists in 'trades'.")

        conn.commit()
        print("🚀 Migration completed successfully.")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
