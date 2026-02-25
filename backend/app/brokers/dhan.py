import httpx
from typing import List, Dict, Any, Optional
from app.brokers.base import BrokerClient
from app.schemas.trade import TradeCreate
from datetime import datetime

from app.models.trade import TradeType, TradeStatus

class DhanClient(BrokerClient):
    BASE_URL = "https://api.dhan.co"

    def __init__(self, client_id: str, access_token: str):
        self.client_id = client_id
        self.access_token = access_token
        self.headers = {
            "access-token": self.access_token,
            "Content-Type": "application/json"
        }

    async def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        return credentials

    async def fetch_orders(
        self, 
        from_date: Optional[str] = None, 
        to_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            if from_date and to_date:
                # Use Dhan v2 Trade History API
                # GET /v2/trades/{from-date}/{to-date}/{page}
                response = await client.get(
                    f"{self.BASE_URL}/v2/trades/{from_date}/{to_date}/0",
                    headers=self.headers
                )
            else:
                # Use current day orders API
                response = await client.get(
                    f"{self.BASE_URL}/orders",
                    headers=self.headers
                )
            response.raise_for_status()
            return response.json()

    def map_to_trade(self, order: Dict[str, Any], portfolio_id: int) -> TradeCreate:
        # Field mapping for both /orders (current day) and /v2/trades (historical)
        symbol = order.get("tradingSymbol") or order.get("trading_symbol", "UNKNOWN")
        
        trade_type_raw = order.get("transactionType") or order.get("transaction_type", "BUY")
        trade_type = TradeType.LONG if trade_type_raw == "BUY" else TradeType.SHORT
        
        entry_price = order.get("avgPrice") or order.get("tradePrice") or 0.0
        entry_date = order.get("createTime") or order.get("updateTime") or order.get("tradeTime") or datetime.now().isoformat()
        quantity = order.get("quantity") or order.get("traded_quantity") or 0
        broker_trade_id = str(order.get("orderId") or order.get("tradeId", ""))

        status = TradeStatus.OPEN
        # Historical trades or filled orders are considered CLOSED for the journal
        if order.get("orderStatus") in ["TRADED", "FILLED"] or "tradeId" in order:
            status = TradeStatus.CLOSED
        
        return TradeCreate(
            symbol=symbol,
            trade_type=trade_type,
            entry_price=entry_price,
            entry_date=entry_date,
            quantity=quantity,
            status=status,
            notes=f"Auto-synced from Dhan.{' (Historical)' if 'tradeId' in order else ''}",
            broker_trade_id=broker_trade_id,
            portfolio_id=portfolio_id
        )
