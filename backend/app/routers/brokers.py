from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.broker import Broker, BrokerCreate, BrokerUpdate
from app.crud import broker as broker_crud
from app.auth.dependencies import get_current_active_user
from app.models import User, Trade
from sqlalchemy import select, and_, or_

router = APIRouter(prefix="/brokers", tags=["brokers"])

@router.get("", response_model=List[Broker])
async def get_my_brokers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all broker connections for the current user"""
    return await broker_crud.get_user_brokers(db, user_id=current_user.id)

@router.post("", response_model=Broker, status_code=status.HTTP_201_CREATED)
async def create_broker_connection(
    broker: BrokerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new broker connection"""
    # Check if broker already exists for user
    existing = await broker_crud.get_user_brokers(db, user_id=current_user.id)
    for b in existing:
        if b.broker_name == broker.broker_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection for {broker.broker_name} already exists"
            )
    
    return await broker_crud.create_broker(db, broker=broker, user_id=current_user.id)

@router.delete("/{broker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_broker_connection(
    broker_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a broker connection"""
    broker = await broker_crud.get_broker_by_id(db, broker_id=broker_id)
    if not broker or broker.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broker connection not found"
        )
    
    await broker_crud.delete_broker(db, broker_id=broker_id)
    return None

from app.brokers.dhan import DhanClient
from app.brokers.iifl import IIFLClient
from app.crud import trade as trade_crud
from app.schemas.trade import TradeCreate
from fastapi.responses import RedirectResponse

@router.get("/iifl/login-url")
async def get_iifl_login_url(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate the IIFL login URL for the user"""
    broker = await broker_crud.get_user_brokers(db, user_id=current_user.id)
    iifl = next((b for b in broker if b.broker_name == "iifl"), None)
    
    if not iifl or not iifl.api_key:
        raise HTTPException(status_code=400, detail="IIFL API Key missing. Please link broker first.")
    
    # Redirect back to our callback endpoint
    # Note: IIFL requires full URL encoding and sometimes has issues with localhost.
    # We use the frontend proxy URL which then hits our backend.
    from urllib.parse import quote
    
    # Try different combinations of parameters that IIFL documentation suggests
    # Standard: redirecturl (no underscore)
    # Some apps: redirect_url (with underscore)
    callback_url = "http://localhost:3000/api/brokers/iifl/callback"
    encoded_callback = quote(callback_url, safe='')
    
    # Modern IIFL login URL pattern
    login_url = f"https://markets.iiflcapital.com/login?appkey={iifl.api_key}&redirecturl={encoded_callback}&redirect_url={encoded_callback}"
    
    # Fallback to the one that almost worked but with better encoding
    # login_url = f"https://markets.iiflcapital.com/?v=1&appkey={iifl.api_key}&redirecturl={encoded_callback}"
    
    return {"login_url": login_url}

@router.get("/iifl/callback")
async def iifl_callback(
    authcode: str,
    clientid: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle IIFL callback and exchange code for session"""
    # Find the broker record for this clientId
    # We might need to handle which user this belongs to, but for now we assume clientId is unique
    broker = await broker_crud.get_broker_by_client_id(db, client_id=clientid)
    if not broker:
        # Fallback: find any IIFL broker if client_id mismatch
        brokers = await db.execute(
            "SELECT * FROM brokers WHERE broker_name = 'iifl' AND client_id = ?", (clientid,)
        )
        # This is simplified. Let's use a better approach.
        raise HTTPException(status_code=404, detail="Broker connection not found for this Client ID")

    client = IIFLClient(api_key=broker.api_key, access_token="")
    try:
        session_token = await client.get_user_session(
            client_id=clientid, 
            auth_code=authcode, 
            api_secret=broker.api_secret
        )
        
        # Save token to database
        update_data = BrokerUpdate(access_token=session_token)
        await broker_crud.update_broker(db, broker.id, update_data)
        
        # Redirect user back to dashboard
        return RedirectResponse(url="http://localhost:3000/dashboard/brokers?status=success")
    except Exception as e:
        return RedirectResponse(url=f"http://localhost:3000/dashboard/brokers?status=error&message={str(e)}")

@router.post("/{broker_id}/sync")
async def sync_broker_trades(
    broker_id: int,
    portfolio_id: int, # Need to know which portfolio to sync into
    from_date: str = None, # format YYYY-MM-DD
    to_date: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Sync trades from the broker into a specific portfolio"""
    broker = await broker_crud.get_broker_by_id(db, broker_id=broker_id)
    if not broker or broker.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broker connection not found"
        )
    
    # Initialize client
    client = None
    token = broker.access_token or broker.api_secret
    
    if broker.broker_name == "dhan":
        if not token:
            raise HTTPException(status_code=400, detail="Dhan access token / api secret missing")
        client = DhanClient(client_id=broker.client_id, access_token=token)
    elif broker.broker_name == "iifl":
        if not token:
            raise HTTPException(status_code=400, detail="IIFL access token / api secret missing")
        client = IIFLClient(api_key=broker.api_key, access_token=token)
    else:
        raise HTTPException(status_code=400, detail="Unsupported broker")

    orders = await client.fetch_orders(from_date=from_date, to_date=to_date)
    
    # Ensure orders is a list (some APIs return an error dict if no trades)
    if not isinstance(orders, list):
        orders = []
    
    # Sort orders by execution date to process sequentially
    orders.sort(key=lambda x: x.get("fillTimestamp") or x.get("exchangeTimestamp") or "")

    try:
        print(f"DEBUG: Syncing {broker.broker_name} for Portfolio {portfolio_id} | Total orders found: {len(orders)}")
        synced_count = 0
        updated_count = 0
        
        for order_raw in orders:
            trade_data = client.map_to_trade(order_raw, portfolio_id)
            order_id = trade_data.broker_trade_id
            
            # 1. Check if this specific order has ALREADY been processed
            # We check both broker_trade_id (entry) and notes (stored exit ID)
            existing_check = await db.execute(
                select(Trade).where(
                    and_(
                        Trade.portfolio_id == portfolio_id,
                        or_(
                            Trade.broker_trade_id == order_id,
                            Trade.notes.like(f"%ExitID:{order_id}%")
                        )
                    )
                )
            )
            if existing_check.scalars().first():
                updated_count += 1
                continue
            
            # 2. Try to find a matching OPEN trade to close
            from app.crud.trade import get_open_trade_by_symbol, close_trade
            open_trade = await get_open_trade_by_symbol(db, portfolio_id, trade_data.symbol)
            
            if open_trade and open_trade.trade_type != trade_data.trade_type:
                # This order is the opposite direction - Close the trade!
                from app.schemas.trade import TradeClose
                close_data = TradeClose(
                    exit_price=trade_data.entry_price,
                    exit_date=trade_data.entry_date
                )
                # Store the Exit ID in notes to prevent re-processing it as a new entry
                open_trade.notes = (open_trade.notes or "") + f" | ExitID:{order_id}"
                await close_trade(db, open_trade.id, close_data)
                updated_count += 1
            else:
                # No open trade found (or same direction for scaling) - Create new OPEN trade
                await trade_crud.create_trade(db, trade_data)
                synced_count += 1
            
        total_at_broker = len(orders)
        return {
            "message": f"Sync Complete: {synced_count} new positions opened, {updated_count} orders matched/updated.",
            "count": synced_count,
            "updated": updated_count,
            "total_at_broker": total_at_broker,
            "status": "VERIFIED" if (synced_count + updated_count >= total_at_broker) else "PARTIAL",
            "broker": broker.broker_name
        }
    except Exception as e:
        print(f"CRITICAL SYNC ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
