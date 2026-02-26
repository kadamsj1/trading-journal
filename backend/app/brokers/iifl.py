import httpx
from typing import List, Dict, Any, Optional
from app.brokers.base import BrokerClient
from app.schemas.trade import TradeCreate
from datetime import datetime

from app.models.trade import TradeType, TradeStatus

class IIFLClient(BrokerClient):
    BASE_URL = "https://api.iiflcapital.com/v1" 

    def __init__(self, api_key: str, access_token: str):
        self.api_key = api_key
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {self.access_token}"
        }

    async def get_user_session(self, client_id: str, auth_code: str, api_secret: str) -> str:
        """Exchange auth_code for a userSession token using SHA256 checksum"""
        import hashlib
        
        # SHA256(CONCATENATION(clientId, authCode, apiSecret))
        raw_string = f"{client_id}{auth_code}{api_secret}"
        checksum = hashlib.sha256(raw_string.encode()).hexdigest()
        
        async with httpx.AsyncClient() as client:
            url = f"{self.BASE_URL}/getusersession"
            payload = {"checkSum": checksum}
            
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code != 200:
                raise Exception(f"Failed to get IIFL Session: {response.status_code} - {response.text}")
                
            data = response.json()
            if data.get("status") == "Ok":
                return data.get("userSession")
            else:
                raise Exception(f"IIFL Session Error: {data.get('message')}")

    async def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        return credentials

    async def fetch_orders(
        self, 
        from_date: Optional[str] = None, 
        to_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            # Use /trades for executed trades as per documentation for journaling
            url = f"{self.BASE_URL}/trades"
            
            response = await client.get(
                url,
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise Exception(f"IIFL API Error: {response.status_code} - {response.text}")
                
            # IIFL /trades returns a list directly or in a result/data field
            data = response.json()
            if isinstance(data, list):
                return data
            
            result = data.get("result", [])
            # IIFL returns a dict with error message in 'result' if no trades exist
            if isinstance(result, list):
                return result
            return []

    def _format_trading_symbol(self, symbol: str) -> str:
        """Format raw ticker to clean 'SYMBOL STRIKE TYPE' format"""
        import re
        # Match pattern: SYMBOL (Letters) + EXPIRY (YYMMM or YYMDD) + STRIKE (Digits/Dots) + TYPE (CE/PE)
        # e.g. SENSEX26FEB82400PE -> SENSEX 82400 PE
        match = re.match(r"^([A-Z]+)(?:\d{2}[A-Z]{3}|\d{5})([\d\.]+)(CE|PE)$", symbol)
        if match:
            root, strike, opt_type = match.groups()
            return f"{root} {strike} {opt_type}"
        return symbol

    def map_to_trade(self, order: Dict[str, Any], portfolio_id: int) -> TradeCreate:
        # Field mapping from IIFL Trade Book documentation
        raw_symbol = order.get("tradingSymbol", "UNKNOWN")
        symbol = self._format_trading_symbol(raw_symbol)
        
        trade_type_raw = order.get("transactionType", "BUY")
        trade_type = TradeType.LONG if trade_type_raw == "BUY" else TradeType.SHORT
        
        # Priotize 'tradedPrice' and 'filledQuantity' for Trade Book (/trades)
        entry_price = float(order.get("tradedPrice") or order.get("averageTradedPrice") or 0.0)
        quantity = int(order.get("filledQuantity") or order.get("quantity") or 0)
        
        # Timestamp reconstruction from separate fields if needed
        raw_date = order.get("fillTimestamp") or order.get("exchangeTimestamp")
        f_date = order.get("fillDate")
        f_time = order.get("fillTime")
        
        try:
            if raw_date:
                # Format: "07-Aug-2024 16:14:17"
                entry_date = datetime.strptime(raw_date, "%d-%b-%Y %H:%M:%S").isoformat()
            elif f_date and f_time:
                # Handle "8/7/2024" and "16:14:17"
                try:
                    combined = f"{f_date} {f_time}"
                    entry_date = datetime.strptime(combined, "%d/%m/%Y %H:%M:%S").isoformat()
                except:
                    # Fallback for different separators
                    combined = f"{f_date} {f_time}"
                    entry_date = datetime.strptime(combined, "%m/%d/%Y %H:%M:%S").isoformat()
            else:
                entry_date = datetime.now().isoformat()
        except:
            entry_date = datetime.now().isoformat()

        # Prioritize exchangeTradeId for uniqueness in journaling fills
        broker_trade_id = str(order.get("exchangeTradeId") or order.get("brokerOrderId") or "")

        return TradeCreate(
            symbol=symbol,
            trade_type=trade_type,
            entry_price=entry_price,
            entry_date=entry_date,
            quantity=quantity,
            status=TradeStatus.OPEN, # Default to OPEN, router will match exits
            notes=f"Auto-synced from IIFL Trade Book.",
            broker_trade_id=broker_trade_id,
            portfolio_id=portfolio_id
        )
