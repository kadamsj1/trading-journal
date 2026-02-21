"""
One-time migration: Add 'charges' column to the trades table.
Run this once: python migrate_add_charges.py
"""
import asyncio
from sqlalchemy import text
from app.database import engine


async def migrate():
    async with engine.begin() as conn:
        # Check if column already exists (SQLite compatible)
        try:
            await conn.execute(text("SELECT charges FROM trades LIMIT 1"))
            print("✅ 'charges' column already exists — no migration needed.")
        except Exception:
            # Column does not exist, add it
            await conn.execute(
                text("ALTER TABLE trades ADD COLUMN charges FLOAT DEFAULT 0.0")
            )
            print("✅ Migration complete: 'charges' column added to trades table.")


if __name__ == "__main__":
    asyncio.run(migrate())
