from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast, Date
from typing import List, Optional
from datetime import date as date_type
from app.models.vault_transaction import VaultTransaction, TransactionType
from app.models.trade import Trade, TradeStatus
from app.models.daily_charge import DailyCharge
from app.schemas.vault_transaction import VaultTransactionCreate, VaultTransactionUpdate


async def create_transaction(
    db: AsyncSession,
    transaction: VaultTransactionCreate,
    portfolio_id: int,
    user_id: int,
    is_auto: bool = False,
    source: str = "manual",
) -> VaultTransaction:
    db_transaction = VaultTransaction(
        portfolio_id=portfolio_id,
        user_id=user_id,
        transaction_type=transaction.transaction_type,
        amount=transaction.amount,
        date=transaction.date,
        notes=transaction.notes,
        is_auto=is_auto,
        source=source,
    )
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def get_portfolio_transactions(
    db: AsyncSession,
    portfolio_id: int
) -> List[VaultTransaction]:
    result = await db.execute(
        select(VaultTransaction)
        .where(VaultTransaction.portfolio_id == portfolio_id)
        .order_by(VaultTransaction.date.desc())
    )
    return result.scalars().all()


async def get_transaction_by_id(
    db: AsyncSession,
    transaction_id: int
) -> Optional[VaultTransaction]:
    result = await db.execute(
        select(VaultTransaction).where(VaultTransaction.id == transaction_id)
    )
    return result.scalar_one_or_none()


async def update_transaction(
    db: AsyncSession,
    transaction_id: int,
    transaction_update: VaultTransactionUpdate
) -> Optional[VaultTransaction]:
    db_transaction = await get_transaction_by_id(db, transaction_id)
    if not db_transaction:
        return None
    update_data = transaction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def delete_transaction(db: AsyncSession, transaction_id: int) -> bool:
    db_transaction = await get_transaction_by_id(db, transaction_id)
    if not db_transaction:
        return False
    await db.delete(db_transaction)
    await db.commit()
    return True


async def get_portfolio_vault_summary(db: AsyncSession, portfolio_id: int) -> dict:
    """Returns total deposits, withdrawals and net flow for a portfolio."""
    result = await db.execute(
        select(
            VaultTransaction.transaction_type,
            func.coalesce(func.sum(VaultTransaction.amount), 0).label("total")
        )
        .where(VaultTransaction.portfolio_id == portfolio_id)
        .group_by(VaultTransaction.transaction_type)
    )
    rows = result.all()
    summary = {t: 0.0 for t in ["deposit", "withdrawal"]}
    count_result = await db.execute(
        select(func.count()).where(VaultTransaction.portfolio_id == portfolio_id)
    )
    total_count = count_result.scalar() or 0
    for row in rows:
        summary[row.transaction_type.value] = float(row.total)
    return {
        "total_deposits": summary["deposit"],
        "total_withdrawals": summary["withdrawal"],
        "net_flow": summary["deposit"] - summary["withdrawal"],
        "transaction_count": total_count,
    }


# ── Day Close ─────────────────────────────────────────────────

async def get_day_close_preview(
    db: AsyncSession,
    portfolio_id: int,
    close_date: date_type,
) -> dict:
    """Preview P&L and charges for a given date before posting."""

    # Closed trades on that date
    trades_result = await db.execute(
        select(Trade)
        .where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED,
                cast(Trade.exit_date, Date) == close_date,
            )
        )
    )
    trades = trades_result.scalars().all()
    pnl_total = sum((t.profit_loss or 0.0) for t in trades)
    trade_count = len(trades)

    # Charges for that date
    charges_result = await db.execute(
        select(func.coalesce(func.sum(DailyCharge.amount), 0))
        .where(
            and_(
                DailyCharge.portfolio_id == portfolio_id,
                DailyCharge.date == close_date,
            )
        )
    )
    charges_total = float(charges_result.scalar() or 0.0)

    # Already closed for this date?
    existing_result = await db.execute(
        select(VaultTransaction)
        .where(
            and_(
                VaultTransaction.portfolio_id == portfolio_id,
                VaultTransaction.date == close_date,
                VaultTransaction.is_auto == True,
            )
        )
    )
    existing = existing_result.scalars().all()

    return {
        "close_date": close_date,
        "pnl_amount": pnl_total,
        "charges_amount": charges_total,
        "trade_count": trade_count,
        "already_closed": len(existing) > 0,
        "existing_entries": existing,
    }


async def execute_day_close(
    db: AsyncSession,
    portfolio_id: int,
    user_id: int,
    close_date: date_type,
) -> dict:
    """
    Auto-post ledger entries for day closing:
    - P&L: Credit if profit, Debit if loss
    - Charges: Debit
    """
    preview = await get_day_close_preview(db, portfolio_id, close_date)

    created_entries = []
    pnl_entry = None
    charges_entry = None

    # ── P&L Entry ────────────────────────────────────────────
    pnl = preview["pnl_amount"]
    if pnl != 0:
        pnl_type = TransactionType.deposit if pnl > 0 else TransactionType.withdrawal
        pnl_amount = abs(pnl)
        trade_count = preview["trade_count"]
        narration = (
            f"Day Close P&L — {trade_count} trade(s) | {'Profit' if pnl > 0 else 'Loss'}"
        )
        pnl_txn = VaultTransaction(
            portfolio_id=portfolio_id,
            user_id=user_id,
            transaction_type=pnl_type,
            amount=pnl_amount,
            date=close_date,
            notes=narration,
            is_auto=True,
            source="day_close_pnl",
        )
        db.add(pnl_txn)
        await db.flush()
        pnl_entry = pnl_txn
        created_entries.append(pnl_txn)

    # ── Charges Entry ─────────────────────────────────────────
    charges = preview["charges_amount"]
    if charges > 0:
        charges_txn = VaultTransaction(
            portfolio_id=portfolio_id,
            user_id=user_id,
            transaction_type=TransactionType.withdrawal,
            amount=charges,
            date=close_date,
            notes=f"Day Close Charges — Brokerage / STT / GST",
            is_auto=True,
            source="day_close_charges",
        )
        db.add(charges_txn)
        await db.flush()
        charges_entry = charges_txn
        created_entries.append(charges_txn)

    await db.commit()
    for e in created_entries:
        await db.refresh(e)

    msg_parts = []
    if pnl_entry:
        sign = "+" if pnl > 0 else "-"
        msg_parts.append(f"P&L {sign}₹{abs(pnl):,.2f} posted")
    if charges_entry:
        msg_parts.append(f"Charges ₹{charges:,.2f} posted")
    if not msg_parts:
        msg_parts.append("No P&L or charges found for this date")

    return {
        "close_date": close_date,
        "entries_created": created_entries,
        "pnl_entry": pnl_entry,
        "charges_entry": charges_entry,
        "message": " | ".join(msg_parts),
    }
