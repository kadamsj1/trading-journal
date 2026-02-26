import asyncio
import sqlite3
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, init_db
from app.models import User, Portfolio, Trade, Broker, DailyCharge
from app.config import get_settings
import os

settings = get_settings()

# SOURCE (SQLite)
SQLITE_DB = "trade_journal.db"

# TARGET (PostgreSQL)
# Ensure this is set to your postgresql+asyncpg:// URL
PG_URL = settings.get_database_url

if "sqlite" in PG_URL and not os.getenv("FORCE_MIGRATION"):
    print(f"ERROR: DATABASE_URL is still pointing to SQLite: {PG_URL}")
    print("Please set DATABASE_URL in your .env or environment to your PostgreSQL URL first.")
    exit(1)

from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        # Common SQLite formats: 
        # "2026-02-17 07:38:05"
        # "2026-02-17T07:38:05"
        # "2026-02-17 07:38:05.000000"
        return datetime.fromisoformat(date_str.replace(" ", "T"))
    except:
        return None

async def migrate():
    print(f"--- Starting Migration ---")
    print(f"Source: {SQLITE_DB}")
    print(f"Target: {PG_URL}")

    # 1. Initialize PG Schema
    print("\n[1/4] Initializing PostgreSQL Schema...")
    target_engine = create_async_engine(PG_URL)
    async with target_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    TargetSession = async_sessionmaker(target_engine, expire_on_commit=False)
    
    # 2. Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    async with TargetSession() as pg_session:
        try:
            # 3. Migrate Users
            print("[2/4] Migrating Users...")
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
            for u in users:
                user_obj = User(
                    id=u['id'],
                    email=u['email'],
                    username=u['username'],
                    hashed_password=u['hashed_password'],
                    full_name=u['full_name'],
                    is_active=bool(u['is_active']),
                    is_admin=bool(u['is_admin']),
                    created_at=parse_date(u['created_at']),
                    updated_at=parse_date(u['updated_at'])
                )
                pg_session.add(user_obj)
            await pg_session.commit()
            print(f"      - {len(users)} users migrated.")

            # 4. Migrate Portfolios
            print("[3/4] Migrating Portfolios...")
            cursor.execute("SELECT * FROM portfolios")
            portfolios = cursor.fetchall()
            for p in portfolios:
                port_obj = Portfolio(
                    id=p['id'],
                    name=p['name'],
                    description=p['description'],
                    initial_balance=p['initial_balance'],
                    user_id=p['user_id'],
                    created_at=parse_date(p['created_at']),
                    updated_at=parse_date(p['updated_at'])
                )
                pg_session.add(port_obj)
            await pg_session.commit()
            print(f"      - {len(portfolios)} portfolios migrated.")

            # 5. Migrate Rest (Trades, Brokers, Charges)
            print("[4/4] Migrating Trades, Brokers, and Charges...")
            
            # Trades
            cursor.execute("SELECT * FROM trades")
            trades = cursor.fetchall()
            for t in trades:
                t_obj = Trade(
                    id=t['id'],
                    portfolio_id=t['portfolio_id'],
                    symbol=t['symbol'],
                    trade_type=t['trade_type'],
                    status=t['status'],
                    entry_price=t['entry_price'],
                    entry_date=parse_date(t['entry_date']),
                    quantity=t['quantity'],
                    exit_price=t['exit_price'],
                    exit_date=parse_date(t['exit_date']),
                    profit_loss=t['profit_loss'],
                    profit_loss_percentage=t['profit_loss_percentage'],
                    charges=t['charges'],
                    notes=t['notes'],
                    tags=t['tags'],
                    emotion=t['emotion'],
                    screenshot_path=t['screenshot_path'],
                    broker_trade_id=t['broker_trade_id'],
                    created_at=parse_date(t['created_at']),
                    updated_at=parse_date(t['updated_at'])
                )
                pg_session.add(t_obj)
            
            # Brokers
            cursor.execute("SELECT * FROM brokers")
            brokers = cursor.fetchall()
            for b in brokers:
                b_obj = Broker(
                    id=b['id'],
                    user_id=b['user_id'],
                    broker_name=b['broker_name'],
                    client_id=b['client_id'],
                    api_key=b['api_key'],
                    api_secret=b['api_secret'],
                    access_token=b['access_token'],
                    refresh_token=b['refresh_token'],
                    token_expiry=parse_date(b['token_expiry']),
                    is_active=bool(b['is_active']),
                    created_at=parse_date(b['created_at']),
                    updated_at=parse_date(b['updated_at'])
                )
                pg_session.add(b_obj)

            # Daily Charges
            cursor.execute("SELECT * FROM daily_charges")
            charges = cursor.fetchall()
            for c in charges:
                c_obj = DailyCharge(
                    id=c['id'],
                    portfolio_id=c['portfolio_id'],
                    date=parse_date(c['date']),
                    amount=c['amount'],
                    notes=c['notes'],
                    created_at=parse_date(c['created_at']),
                    updated_at=parse_date(c['updated_at'])
                )
                pg_session.add(c_obj)

            await pg_session.commit()
            print(f"      - {len(trades)} trades migrated.")
            print(f"      - {len(brokers)} broker connections migrated.")
            print(f"      - {len(charges)} daily charges migrated.")

            # Fix sequences in PG (very important!)
            print("\n[5/5] Resetting ID sequences in PostgreSQL...")
            for table in ["users", "portfolios", "trades", "brokers", "daily_charges"]:
                await pg_session.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table}"))
            await pg_session.commit()

            print("\nMigration Finished Successfully!")

        except Exception as e:
            print(f"\nMigration Failed: {str(e)}")
            await pg_session.rollback()
            raise e
        finally:
            sqlite_conn.close()
            await target_engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
