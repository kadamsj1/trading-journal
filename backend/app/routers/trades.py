from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pathlib import Path
import aiofiles
from datetime import datetime
from app.database import get_db
from app.schemas.trade import Trade, TradeCreate, TradeUpdate, TradeClose
from app.models.trade import TradeStatus
from app.crud import trade as trade_crud
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user
from app.models import User

from app.config import get_settings
import os

settings = get_settings()
router = APIRouter(prefix="/trades", tags=["trades"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(settings.UPLOAD_DIR)

# Vercel fix: Use /tmp for uploads
if os.getenv("VERCEL"):
    UPLOAD_DIR = Path("/tmp") / settings.UPLOAD_DIR

try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create upload directory {UPLOAD_DIR}: {e}")


@router.get("/portfolio/{portfolio_id}/export")
async def export_portfolio_trades(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Export all trades for a portfolio in CSV format"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    trades = await trade_crud.get_portfolio_trades(db, portfolio_id=portfolio_id)
    
    import csv
    import io
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "Symbol", "Type", "Status", "Quantity", 
        "Entry Price", "Entry Date", "Exit Price", "Exit Date", 
        "Gross P&L", "Charges", "Net P&L", "P&L %", "Emotion", "Notes", "Tags"
    ])
    
    # Rows
    for t in trades:
        # Calculate Gross P&L if not already there
        gross_pl = (t.profit_loss or 0) + (t.charges or 0) if t.status == TradeStatus.CLOSED else 0
        
        writer.writerow([
            t.id, t.symbol, t.trade_type.value if hasattr(t.trade_type, "value") else t.trade_type,
            t.status.value if hasattr(t.status, "value") else t.status,
            t.quantity, t.entry_price, t.entry_date.strftime("%Y-%m-%d %H:%M:%S") if t.entry_date else "",
            t.exit_price or "", t.exit_date.strftime("%Y-%m-%d %H:%M:%S") if t.exit_date else "",
            round(gross_pl, 2), t.charges or 0, t.profit_loss or 0,
            round(t.profit_loss_percentage or 0, 2), t.emotion or "", t.notes or "", t.tags or ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=portfolio_{portfolio_id}_trades.csv"}
    )


async def verify_portfolio_ownership(portfolio_id: int, user_id: int, db: AsyncSession):
    """Helper function to verify user owns the portfolio"""
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

def generate_initial_tags(symbol: str, trade_type: str) -> List[str]:
    tags = []
    
    # Tag by symbol type
    upper_symbol = symbol.upper()
    if 'NIFTY' in upper_symbol or 'SENSEX' in upper_symbol:
        tags.append('Index')
    elif 'FUT' in upper_symbol:
        tags.append('Futures')
    elif 'CE' in upper_symbol or 'PE' in upper_symbol:
        tags.append('Options')
    else:
        tags.append('Equity')

    # Tag by trade type
    tags.append(trade_type.capitalize())
    
    return tags

def generate_closing_tags(entry_date: datetime, exit_date: datetime, profit_loss: float, profit_loss_percentage: float) -> List[str]:
    tags = []
    
    # Tag by result
    if profit_loss > 0:
        tags.append('Win')
        if profit_loss_percentage >= 5.0:
            tags.append('Big Win')
    elif profit_loss < 0:
        tags.append('Loss')
        if profit_loss_percentage <= -5.0:
            tags.append('Big Loss')
    else:
        tags.append('Break Even')

    # Tag by duration
    duration = exit_date - entry_date
    minutes = duration.total_seconds() / 60
    
    if minutes < 15:
        tags.append('Scalp')
    elif entry_date.date() == exit_date.date():
        tags.append('Intraday')
    else:
        tags.append('Swing')
        
    return tags

@router.get("/portfolio/{portfolio_id}", response_model=List[Trade])
async def get_portfolio_trades(
    portfolio_id: int,
    status: Optional[TradeStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all trades for a portfolio"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    trades = await trade_crud.get_portfolio_trades(db, portfolio_id=portfolio_id, status=status)
    return trades


@router.post("/", response_model=Trade, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade: TradeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new trade with auto-tagging"""
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)
    
    # Generate initial tags
    auto_tags = generate_initial_tags(trade.symbol, trade.trade_type)
    
    # Merge with user provided tags
    current_tags = []
    if trade.tags:
        current_tags = [t.strip() for t in trade.tags.split(',') if t.strip()]
    
    # Combine unique tags
    all_tags = list(set(current_tags + auto_tags))
    trade.tags = ",".join(all_tags)
    
    return await trade_crud.create_trade(db, trade=trade)


@router.get("/{trade_id}", response_model=Trade)
async def get_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)
    return trade


@router.patch("/{trade_id}", response_model=Trade)
async def update_trade(
    trade_id: int,
    trade_update: TradeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    updated_trade = await trade_crud.update_trade(db, trade_id=trade_id, trade_update=trade_update)
    return updated_trade


@router.post("/{trade_id}/close", response_model=Trade)
async def close_trade(
    trade_id: int,
    trade_close: TradeClose,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Close a trade, calculate P&L, and auto-tag"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    if trade.status == TradeStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trade is already closed"
        )

    # Close the trade first to get P&L calculations
    closed_trade = await trade_crud.close_trade(db, trade_id=trade_id, trade_close=trade_close)
    
    # Generate closing tags
    closing_tags = generate_closing_tags(
        closed_trade.entry_date, 
        closed_trade.exit_date, 
        closed_trade.profit_loss, 
        closed_trade.profit_loss_percentage
    )
    
    # Merge with existing tags
    current_tags = []
    if closed_trade.tags:
        current_tags = [t.strip() for t in closed_trade.tags.split(',') if t.strip()]
        
    all_tags = list(set(current_tags + closing_tags))
    new_tags_str = ",".join(all_tags)
    
    # Update trade with new tags
    trade_update = TradeUpdate(tags=new_tags_str)
    final_trade = await trade_crud.update_trade(db, trade_id=trade_id, trade_update=trade_update)
    
    return final_trade


@router.post("/{trade_id}/screenshot")
async def upload_screenshot(
    trade_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a screenshot for a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    # Validate file type
    print(f"DEBUG: Received file with content_type: {file.content_type}")
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/octet-stream"]
    if file.content_type not in allowed_types:
        # Fallback check for extension
        ext = Path(file.filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only image files (JPEG, PNG, WebP) are allowed. Got: {file.content_type}"
            )

    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = Path(file.filename).suffix
    filename = f"trade_{trade_id}_{timestamp}{file_extension}"
    file_path = UPLOAD_DIR / filename

    # Save file asynchronously (non-blocking)
    contents = await file.read()
    async with aiofiles.open(file_path, "wb") as buffer:
        await buffer.write(contents)

    # Store only the filename so the frontend URL is: /api/uploads/screenshots/<filename>
    from app.schemas.trade import TradeUpdate
    trade_update = TradeUpdate(screenshot_path=filename)
    await trade_crud.update_trade(db, trade_id=trade_id, trade_update=trade_update)

    return {"filename": filename, "path": str(file_path)}


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    await trade_crud.delete_trade(db, trade_id=trade_id)
    return None
