"""
Migration script: Local PostgreSQL → Neon
Usage: python migrate_to_neon.py <NEON_DATABASE_URL>
Example:
  python migrate_to_neon.py "postgresql+asyncpg://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?ssl=require"
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

LOCAL_URL = "postgresql+asyncpg://hospitech360:hospitech360@localhost:5432/trading_journal"

TABLES = [
    "users",
    "portfolios",
    "trades",
    "daily_charges",
    "brokers",
    "vault_transactions",
]

async def migrate(neon_url: str):
    print(f"\n🔄 Connecting to local DB...")
    local_engine = create_async_engine(LOCAL_URL, echo=False)

    print(f"🔄 Connecting to Neon...")
    neon_engine = create_async_engine(neon_url, echo=False)

    # Import models and create tables on Neon
    print("📦 Creating tables on Neon...")
    import os, sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app.database import Base
    import app.models  # noqa: ensure all models are imported

    async with neon_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created on Neon")

    # Migrate data table by table
    async with local_engine.connect() as local_conn:
        async with neon_engine.begin() as neon_conn:
            for table in TABLES:
                try:
                    result = await local_conn.execute(text(f"SELECT * FROM {table}"))
                    rows = result.fetchall()
                    columns = result.keys()

                    if not rows:
                        print(f"⚪ {table}: 0 rows (skipping)")
                        continue

                    # Clear existing data in Neon table
                    await neon_conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))

                    # Insert rows
                    col_names = ", ".join(columns)
                    placeholders = ", ".join([f":{c}" for c in columns])
                    insert_sql = text(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})")

                    row_dicts = [dict(zip(columns, row)) for row in rows]
                    for row_dict in row_dicts:
                        await neon_conn.execute(insert_sql, row_dict)

                    print(f"✅ {table}: {len(rows)} rows migrated")

                    # Reset sequences for integer primary keys
                    try:
                        await neon_conn.execute(text(
                            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                            f"(SELECT MAX(id) FROM {table}) + 1)"
                        ))
                    except Exception:
                        pass  # Table might not have a serial id

                except Exception as e:
                    print(f"⚠️  {table}: Error — {e}")

    await local_engine.dispose()
    await neon_engine.dispose()
    print("\n🎉 Migration complete! Your data is now on Neon.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_neon.py \"<NEON_URL>\"")
        print("Example:")
        print('  python migrate_to_neon.py "postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?ssl=require"')
        sys.exit(1)

    neon_url = sys.argv[1]
    asyncio.run(migrate(neon_url))
