from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class DailyChargeCreate(BaseModel):
    portfolio_id: int
    date: date
    amount: float
    notes: Optional[str] = None


class DailyChargeUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class DailyChargeResponse(BaseModel):
    id: int
    portfolio_id: int
    date: date
    amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
