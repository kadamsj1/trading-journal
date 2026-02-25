from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models import Trade
from app.models.trade import TradeStatus
from app.schemas.trade import TradeCreate, TradeUpdate, TradeClose
from typing import Optional, List


def calculate_profit_loss(trade: Trade) -> tuple[float, float]:
    """Calculate profit/loss and percentage for a trade"""
    if trade.exit_price is None:
        return 0.0, 0.0

    # Determine trade type
    t_type = trade.trade_type
    if hasattr(t_type, "value"):
        t_type = t_type.value
        
    if t_type == "long":
        gross_pl = (trade.exit_price - trade.entry_price) * trade.quantity
    else:  # short
        gross_pl = (trade.entry_price - trade.exit_price) * trade.quantity

    # Subtract per-trade charges
    net_pl = gross_pl - (trade.charges or 0.0)
    
    # Calculate percentage based on total trade value
    pl_percentage = (net_pl / (trade.entry_price * trade.quantity)) * 100
    return net_pl, pl_percentage


async def get_trade_by_id(db: AsyncSession, trade_id: int) -> Optional[Trade]:
    result = await db.execute(select(Trade).where(Trade.id == trade_id))
    return result.scalar_one_or_none()


async def get_trade_by_broker_id(db: AsyncSession, broker_trade_id: str) -> Optional[Trade]:
    result = await db.execute(select(Trade).where(Trade.broker_trade_id == broker_trade_id))
    return result.scalars().first()


async def get_open_trade_by_symbol(db: AsyncSession, portfolio_id: int, symbol: str) -> Optional[Trade]:
    # Order by entry_date to match with the oldest open position if multiple exist
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.symbol == symbol,
                Trade.status == TradeStatus.OPEN
            )
        ).order_by(Trade.entry_date.asc())
    )
    return result.scalars().first()


async def get_portfolio_trades(
    db: AsyncSession,
    portfolio_id: int,
    status: Optional[TradeStatus] = None
) -> List[Trade]:
    query = select(Trade).where(Trade.portfolio_id == portfolio_id)
    if status:
        query = query.where(Trade.status == status)
    result = await db.execute(query.order_by(Trade.entry_date.desc()))
    return list(result.scalars().all())


async def create_trade(db: AsyncSession, trade: TradeCreate) -> Trade:
    db_trade = Trade(**trade.model_dump())
    db.add(db_trade)
    await db.commit()
    await db.refresh(db_trade)
    return db_trade


async def update_trade(
    db: AsyncSession,
    trade_id: int,
    trade_update: TradeUpdate
) -> Optional[Trade]:
    result = await db.execute(select(Trade).where(Trade.id == trade_id))
    db_trade = result.scalar_one_or_none()

    if db_trade is None:
        return None

    update_data = trade_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_trade, field, value)

    # Recalculate P&L if exit price changed
    if db_trade.exit_price is not None:
        pl, pl_pct = calculate_profit_loss(db_trade)
        db_trade.profit_loss = pl
        db_trade.profit_loss_percentage = pl_pct

    await db.commit()
    await db.refresh(db_trade)
    return db_trade


async def close_trade(db: AsyncSession, trade_id: int, trade_close: TradeClose) -> Optional[Trade]:
    result = await db.execute(select(Trade).where(Trade.id == trade_id))
    db_trade = result.scalar_one_or_none()

    if db_trade is None:
        return None

    db_trade.exit_price = trade_close.exit_price
    db_trade.exit_date = trade_close.exit_date
    db_trade.status = TradeStatus.CLOSED

    # Calculate P&L
    pl, pl_pct = calculate_profit_loss(db_trade)
    db_trade.profit_loss = pl
    db_trade.profit_loss_percentage = pl_pct

    await db.commit()
    await db.refresh(db_trade)
    return db_trade


async def delete_trade(db: AsyncSession, trade_id: int) -> bool:
    result = await db.execute(select(Trade).where(Trade.id == trade_id))
    db_trade = result.scalar_one_or_none()

    if db_trade is None:
        return False

    await db.delete(db_trade)
    await db.commit()
    return True
