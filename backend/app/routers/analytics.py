from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Dict, Any, List
from app.database import get_db
from app.models import Trade, Portfolio, User
from app.models.trade import TradeStatus
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user
import numpy as np

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

    # Calculate statistics
    total_trades = len(closed_trades)
    
    if total_trades == 0:
        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.name,
            "total_trades": 0,
            "total_profit_loss": 0.0,
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

    total_pl = sum(t.profit_loss or 0 for t in closed_trades)
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
                "sub_symbols": set()
            }

        symbol_stats[base_symbol]["total_trades"] += 1
        symbol_stats[base_symbol]["total_profit_loss"] += trade.profit_loss or 0
        symbol_stats[base_symbol]["sub_symbols"].add(original_symbol)
        
        if (trade.profit_loss or 0) > 0:
            symbol_stats[base_symbol]["wins"] += 1
        else:
            symbol_stats[base_symbol]["losses"] += 1

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
    """Get daily P&L for a portfolio"""
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

    # Group by date
    daily_stats = {}
    for trade in closed_trades:
        # Assuming exit_date is the date when P&L is realized
        if not trade.exit_date:
            continue
            
        date_str = trade.exit_date.strftime("%Y-%m-%d")
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "profit_loss": 0.0,
                "trade_count": 0
            }
        
        daily_stats[date_str]["profit_loss"] += trade.profit_loss or 0
        daily_stats[date_str]["trade_count"] += 1

    # Round P&L
    for date in daily_stats:
        daily_stats[date]["profit_loss"] = round(daily_stats[date]["profit_loss"], 2)

    return {"daily_pl": list(daily_stats.values())}

