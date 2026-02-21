"""
Migration: Create 'daily_charges' table.
Run: python migrate_add_daily_charges.py
"""
import asyncio
from sqlalchemy import text
from app.database import engine


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS daily_charges (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                portfolio_id  INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
                date          DATE    NOT NULL,
                amount        REAL    NOT NULL,
                notes         TEXT,
                created_at    DATETIME DEFAULT (CURRENT_TIMESTAMP),
                updated_at    DATETIME
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_daily_charges_date ON daily_charges (date)"
        ))
    print("✅ Migration complete: 'daily_charges' table created.")


if __name__ == "__main__":
    asyncio.run(migrate())
