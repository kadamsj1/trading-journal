from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class TransactionType(str, Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"


class VaultTransactionCreate(BaseModel):
    transaction_type: TransactionType
    amount: float = Field(gt=0, description="Amount must be greater than 0")
    date: date
    notes: Optional[str] = None


class VaultTransactionUpdate(BaseModel):
    transaction_type: Optional[TransactionType] = None
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[date] = None
    notes: Optional[str] = None


class VaultTransaction(BaseModel):
    id: int
    portfolio_id: int
    user_id: int
    transaction_type: TransactionType
    amount: float
    date: date
    notes: Optional[str] = None
    is_auto: bool = False
    source: str = "manual"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VaultSummary(BaseModel):
    total_deposits: float
    total_withdrawals: float
    net_flow: float
    transaction_count: int


# ── Day Close schemas ─────────────────────────────────────────
class DayClosePreview(BaseModel):
    """Preview of what will be auto-posted for a day close."""
    close_date: date
    pnl_amount: float          # Net P&L from closed trades that day
    charges_amount: float      # Total charges for that day
    trade_count: int           # Number of trades closed that day
    already_closed: bool       # If day close already run for this date
    existing_entries: List[VaultTransaction] = []


class DayCloseResult(BaseModel):
    """Result after executing day close."""
    close_date: date
    entries_created: List[VaultTransaction]
    pnl_entry: Optional[VaultTransaction] = None
    charges_entry: Optional[VaultTransaction] = None
    message: str
