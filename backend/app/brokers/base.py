from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.trade import TradeCreate

class BrokerClient(ABC):
    @abstractmethod
    async def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Authenticate and return tokens"""
        pass

    @abstractmethod
    async def fetch_orders(
        self, 
        from_date: Optional[str] = None, 
        to_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Fetch orders from broker within a date range (YYYY-MM-DD)"""
        pass

    @abstractmethod
    def map_to_trade(self, order: Dict[str, Any], portfolio_id: int) -> TradeCreate:
        """Map broker order to internal TradeCreate schema"""
        pass
