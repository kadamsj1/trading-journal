from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.alert import AlertCondition


class AlertBase(BaseModel):
    symbol: str
    price: float
    condition: AlertCondition
    message: Optional[str] = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    symbol: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[AlertCondition] = None
    message: Optional[str] = None
    is_active: Optional[bool] = None


class Alert(AlertBase):
    id: int
    user_id: int
    is_active: bool
    is_triggered: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
