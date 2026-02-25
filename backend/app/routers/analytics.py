from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Dict, Any, List
from app.database import get_db
from app.models import Trade, Portfolio, User, DailyCharge
from app.models.trade import TradeStatus
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

async def verify_portfolio_ownership(portfolio_id: int, user_id: int, db: AsyncSession):
    portfolio = await portfolio_crud.get_portfolio_by_id(db, portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    if portfolio.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this portfolio"
        )
    return portfolio

@router.get("/portfolio/{portfolio_id}", response_model=Dict[str, Any])
async def get_portfolio_analytics(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    portfolio = await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # Get all closed trades
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(result.scalars().all())

    # Get total daily charges
    charge_res = await db.execute(
        select(func.sum(DailyCharge.amount)).where(DailyCharge.portfolio_id == portfolio_id)
    )
    total_daily_charges = charge_res.scalar() or 0.0

    # Calculate statistics
    total_trades = len(closed_trades)
    
    if total_trades == 0:
        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.name,
            "total_trades": 0,
            "total_profit_loss": round(-total_daily_charges, 2),
            "win_rate": 0.0,
            "average_profit_loss": 0.0,
            "best_trade": None,
            "worst_trade": None,
            "total_wins": 0,
            "total_losses": 0,
            "average_win": 0.0,
            "average_loss": 0.0,
            "profit_factor": 0.0,
            "patterns": []
        }

    total_pl = sum(t.profit_loss or 0 for t in closed_trades) - total_daily_charges
    winning_trades = [t for t in closed_trades if (t.profit_loss or 0) > 0]
    losing_trades = [t for t in closed_trades if (t.profit_loss or 0) <= 0]

    total_wins = len(winning_trades)
    total_losses = len(losing_trades)
    win_rate = (total_wins / total_trades) * 100 if total_trades > 0 else 0

    avg_pl = total_pl / total_trades if total_trades > 0 else 0
    avg_win = sum(t.profit_loss for t in winning_trades) / total_wins if total_wins > 0 else 0
    avg_loss = sum(t.profit_loss for t in losing_trades) / total_losses if total_losses > 0 else 0

    total_win_amount = sum(t.profit_loss for t in winning_trades)
    total_loss_amount = abs(sum(t.profit_loss for t in losing_trades))
    profit_factor = total_win_amount / total_loss_amount if total_loss_amount > 0 else 0

    best_trade = max(closed_trades, key=lambda t: t.profit_loss or 0)
    worst_trade = min(closed_trades, key=lambda t: t.profit_loss or 0)

    # Detailed statistics
    max_profit = max(t.profit_loss for t in winning_trades) if winning_trades else 0.0
    min_profit = min(t.profit_loss for t in winning_trades) if winning_trades else 0.0
    
    # Negative trades only for loss stats
    only_losses = [t for t in losing_trades if (t.profit_loss or 0) < 0]
    max_loss = min(t.profit_loss for t in only_losses) if only_losses else 0.0
    min_loss = max(t.profit_loss for t in only_losses) if only_losses else 0.0

    # Simple AI Pattern Recognition
    patterns = analyze_patterns(closed_trades)

    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        "total_trades": total_trades,
        "total_profit_loss": round(total_pl, 2),
        "win_rate": round(win_rate, 2),
        "average_profit_loss": round(avg_pl, 2),
        "best_trade": {
            "id": best_trade.id,
            "symbol": best_trade.symbol,
            "profit_loss": round(best_trade.profit_loss or 0, 2),
        },
        "worst_trade": {
            "id": worst_trade.id,
            "symbol": worst_trade.symbol,
            "profit_loss": round(worst_trade.profit_loss or 0, 2),
        },
        "total_wins": total_wins,
        "total_losses": total_losses,
        "average_win": round(avg_win, 2),
        "average_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2),
        "max_profit": round(max_profit, 2),
        "min_profit": round(min_profit, 2),
        "max_loss": round(max_loss, 2),
        "min_loss": round(min_loss, 2),
        "patterns": patterns
    }


def analyze_patterns(trades: List[Trade]) -> List[Dict[str, Any]]:
    # Simple logic to identify winning/losing patterns
    # In a real AI scenario, this would use ML models
    patterns = []
    
    long_trades = [t for t in trades if t.trade_type == 'long']
    short_trades = [t for t in trades if t.trade_type == 'short']

    # Analyze Direction
    if long_trades:
        long_win_rate = len([t for t in long_trades if (t.profit_loss or 0) > 0]) / len(long_trades)
        if long_win_rate > 0.6:
            patterns.append({
                "type": "strength",
                "name": "Bullish Trend Master",
                "description": f"You have a high win rate ({long_win_rate:.0%}) with long positions.",
                "confidence": "High"
            })
        elif long_win_rate < 0.4:
            patterns.append({
                "type": "weakness",
                "name": "Bullish Struggle",
                "description": f"Your long positions are underperforming (win rate: {long_win_rate:.0%}). Consider reviewing your entry criteria.",
                "confidence": "Medium"
            })

    if short_trades:
        short_win_rate = len([t for t in short_trades if (t.profit_loss or 0) > 0]) / len(short_trades)
        if short_win_rate > 0.6:
            patterns.append({
                "type": "strength",
                "name": "Bear Market Pro",
                "description": f"Excellent performance on short trades with a {short_win_rate:.0%} win rate.",
                "confidence": "High"
            })
    
    return patterns

@router.get("/portfolio/{portfolio_id}/by-symbol", response_model=Dict[str, Any])
async def get_analytics_by_symbol(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get analytics grouped by trading symbol"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # Get all closed trades
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(result.scalars().all())

    # Group by base symbol (e.g., "NIFTY 25900 CE" becomes "NIFTY")
    symbol_stats = {}
    for trade in closed_trades:
        # Extract base symbol: Take the first word (professional for Indian markets)
        original_symbol = trade.symbol.strip()
        base_symbol = original_symbol.split()[0].upper()
        
        if base_symbol not in symbol_stats:
            symbol_stats[base_symbol] = {
                "symbol": base_symbol,
                "display_symbol": base_symbol,
                "total_trades": 0,
                "total_profit_loss": 0.0,
                "wins": 0,
                "losses": 0,
                "win_amount": 0.0,   # sum of profitable trade P&L
                "loss_amount": 0.0,  # sum of losing trade P&L (absolute)
                "sub_symbols": set()
            }

        symbol_stats[base_symbol]["total_trades"] += 1
        symbol_stats[base_symbol]["total_profit_loss"] += trade.profit_loss or 0
        symbol_stats[base_symbol]["sub_symbols"].add(original_symbol)

        pl = trade.profit_loss or 0
        if pl > 0:
            symbol_stats[base_symbol]["wins"] += 1
            symbol_stats[base_symbol]["win_amount"] += pl
        else:
            symbol_stats[base_symbol]["losses"] += 1
            symbol_stats[base_symbol]["loss_amount"] += abs(pl)

    # Calculate win rates and format output
    final_stats = []
    for base in symbol_stats:
        total = symbol_stats[base]["total_trades"]
        wins = symbol_stats[base]["wins"]
        
        stat = {
            "symbol": base,
            "total_trades": total,
            "total_profit_loss": round(symbol_stats[base]["total_profit_loss"], 2),
            "wins": wins,
            "losses": symbol_stats[base]["losses"],
            "win_rate": round((wins / total) * 100, 2) if total > 0 else 0,
            "win_amount":  round(symbol_stats[base]["win_amount"],  2),
            "loss_amount": round(symbol_stats[base]["loss_amount"], 2),
            "details": ", ".join(list(symbol_stats[base]["sub_symbols"])[:3]) + ("..." if len(symbol_stats[base]["sub_symbols"]) > 3 else "")
        }
        final_stats.append(stat)

    return {"symbols": final_stats}

@router.get("/portfolio/{portfolio_id}/daily-pl", response_model=Dict[str, Any])
async def get_daily_pl(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get daily P&L for a portfolio (including trade P&L and daily charges)"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # 1. Get all closed trades
    trade_res = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(trade_res.scalars().all())

    # 2. Get all daily charges
    charge_res = await db.execute(
        select(DailyCharge).where(DailyCharge.portfolio_id == portfolio_id)
    )
    daily_charges = list(charge_res.scalars().all())

    import datetime as dt
    IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

    daily_stats = {}

    # Aggregate trade P&L
    for trade in closed_trades:
        if not trade.exit_date:
            continue
            
        exit_utc = trade.exit_date
        if exit_utc.tzinfo is None:
            exit_utc = exit_utc.replace(tzinfo=dt.timezone.utc)
        exit_ist = exit_utc.astimezone(IST)
        date_str = exit_ist.strftime("%Y-%m-%d")

        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "profit_loss": 0.0,
                "trade_count": 0
            }

        daily_stats[date_str]["profit_loss"] += trade.profit_loss or 0
        daily_stats[date_str]["trade_count"] += 1

    # Subtract Daily Charges
    for dc in daily_charges:
        # dc.date is standard naive date object
        date_str = dc.date.strftime("%Y-%m-%d")
        
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "profit_loss": 0.0,
                "trade_count": 0
            }
        
        daily_stats[date_str]["profit_loss"] -= dc.amount or 0.0

    # Round P&L
    result_list = list(daily_stats.values())
    for item in result_list:
        item["profit_loss"] = round(item["profit_loss"], 2)

    return {"daily_pl": result_list}



@router.get("/portfolio/{portfolio_id}/weekly-performance", response_model=Dict[str, Any])
async def get_weekly_performance(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get weekly aggregated P&L performance (trades + daily charges) for a portfolio"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # ── fetch closed trades ──────────────────────────
    trade_res = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(trade_res.scalars().all())

    # ── fetch daily charges ──────────────────────────
    charge_res = await db.execute(
        select(DailyCharge).where(DailyCharge.portfolio_id == portfolio_id)
    )
    daily_charges = list(charge_res.scalars().all())

    import datetime as dt
    IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

    weekly_stats: Dict[str, Any] = {}

    def ensure_week(year: int, week: int):
        week_key = f"{year}-W{week:02d}"
        if week_key not in weekly_stats:
            week_start = dt.date.fromisocalendar(year, week, 1)
            week_end   = dt.date.fromisocalendar(year, week, 5)
            label = f"{week_start.strftime('%d %b')} \u2013 {week_end.strftime('%d %b')}"
            weekly_stats[week_key] = {
                "week": week_key,
                "label": label,
                "profit_loss": 0.0,
                "total_profit": 0.0,   # sum of winning trade P&L
                "total_loss": 0.0,     # sum of losing trade P&L (absolute)
                "charges": 0.0,
                "trade_count": 0,
                "wins": 0,
                "losses": 0,
                "best_trade": None,
                "worst_trade": None,
            }
        return week_key

    # aggregate trades
    for trade in closed_trades:
        if not trade.exit_date:
            continue
        exit_utc = trade.exit_date
        if exit_utc.tzinfo is None:
            exit_utc = exit_utc.replace(tzinfo=dt.timezone.utc)
        exit_ist = exit_utc.astimezone(IST).date()
        year = exit_ist.isocalendar()[0]
        week = exit_ist.isocalendar()[1]
        wk = ensure_week(year, week)

        pl = trade.profit_loss or 0.0
        weekly_stats[wk]["profit_loss"] += pl
        weekly_stats[wk]["trade_count"] += 1

        if pl > 0:
            weekly_stats[wk]["wins"] += 1
            weekly_stats[wk]["total_profit"] += pl
        else:
            weekly_stats[wk]["losses"] += 1
            weekly_stats[wk]["total_loss"] += abs(pl)

        cur_best = weekly_stats[wk]["best_trade"]
        if cur_best is None or pl > cur_best:
            weekly_stats[wk]["best_trade"] = pl

        cur_worst = weekly_stats[wk]["worst_trade"]
        if cur_worst is None or pl < cur_worst:
            weekly_stats[wk]["worst_trade"] = pl

    # aggregate daily charges by ISO week
    for dc in daily_charges:
        d = dc.date
        year = d.isocalendar()[0]
        week = d.isocalendar()[1]
        wk = ensure_week(year, week)
        weekly_stats[wk]["charges"] += dc.amount or 0.0

    # final cleanup
    result_list = []
    for wk in sorted(weekly_stats.keys()):
        data = weekly_stats[wk]
        total   = data["trade_count"]
        wins    = data["wins"]
        gross   = data["profit_loss"]
        charges = data["charges"]
        data["profit_loss"]     = round(gross, 2)
        data["total_profit"]    = round(data["total_profit"], 2)
        data["total_loss"]      = round(data["total_loss"], 2)
        data["charges"]         = round(charges, 2)
        data["net_profit_loss"] = round(gross - charges, 2)
        data["win_rate"]        = round((wins / total) * 100, 2) if total > 0 else 0
        data["best_trade"]      = round(data["best_trade"],  2) if data["best_trade"]  is not None else 0
        data["worst_trade"]     = round(data["worst_trade"], 2) if data["worst_trade"] is not None else 0
        result_list.append(data)

    return {"weekly": result_list}
