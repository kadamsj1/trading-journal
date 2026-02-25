from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BrokerBase(BaseModel):
    broker_name: str # 'dhan', 'iifl'
    client_id: Optional[str] = None
    api_key: Optional[str] = None
    is_active: bool = True

class BrokerCreate(BrokerBase):
    api_secret: Optional[str] = None

class BrokerUpdate(BaseModel):
    client_id: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expiry: Optional[datetime] = None
    is_active: Optional[bool] = None

class Broker(BrokerBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
