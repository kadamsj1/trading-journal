from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
from app.database import get_db
from app.schemas.vault_transaction import (
    VaultTransaction, VaultTransactionCreate, VaultTransactionUpdate,
    VaultSummary, DayClosePreview, DayCloseResult
)
from app.crud import vault_transaction as vault_crud
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user
from app.models import User

router = APIRouter(prefix="/vault", tags=["vault"])


async def _check_portfolio_ownership(portfolio_id: int, current_user: User, db: AsyncSession):
    portfolio = await portfolio_crud.get_portfolio_by_id(db, portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    if portfolio.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return portfolio


@router.get("/portfolio/{portfolio_id}", response_model=List[VaultTransaction])
async def get_vault_transactions(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all ledger transactions for a portfolio."""
    await _check_portfolio_ownership(portfolio_id, current_user, db)
    return await vault_crud.get_portfolio_transactions(db, portfolio_id=portfolio_id)


@router.get("/portfolio/{portfolio_id}/summary", response_model=VaultSummary)
async def get_vault_summary(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get credit/debit summary for a portfolio."""
    await _check_portfolio_ownership(portfolio_id, current_user, db)
    return await vault_crud.get_portfolio_vault_summary(db, portfolio_id=portfolio_id)


@router.post("/portfolio/{portfolio_id}", response_model=VaultTransaction, status_code=status.HTTP_201_CREATED)
async def create_vault_transaction(
    portfolio_id: int,
    transaction: VaultTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a manual credit or debit ledger entry."""
    await _check_portfolio_ownership(portfolio_id, current_user, db)
    return await vault_crud.create_transaction(
        db, transaction=transaction, portfolio_id=portfolio_id, user_id=current_user.id
    )


# ── Day Close Endpoints ──────────────────────────────────────

@router.get("/portfolio/{portfolio_id}/day-close/preview", response_model=DayClosePreview)
async def preview_day_close(
    portfolio_id: int,
    close_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Preview P&L and charges before executing day close for a date."""
    await _check_portfolio_ownership(portfolio_id, current_user, db)
    result = await vault_crud.get_day_close_preview(db, portfolio_id=portfolio_id, close_date=close_date)
    return result


@router.post("/portfolio/{portfolio_id}/day-close", response_model=DayCloseResult)
async def execute_day_close(
    portfolio_id: int,
    close_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Execute day close — auto-posts:
    - P&L entry: Credit (profit) or Debit (loss) from closed trades
    - Charges entry: Debit from daily charges
    """
    await _check_portfolio_ownership(portfolio_id, current_user, db)

    # Check if already closed
    preview = await vault_crud.get_day_close_preview(db, portfolio_id=portfolio_id, close_date=close_date)
    if preview["already_closed"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Day close already executed for {close_date}. Delete existing auto entries first."
        )

    result = await vault_crud.execute_day_close(
        db, portfolio_id=portfolio_id, user_id=current_user.id, close_date=close_date
    )
    return result


# ── CRUD endpoints ───────────────────────────────────────────

@router.patch("/{transaction_id}", response_model=VaultTransaction)
async def update_vault_transaction(
    transaction_id: int,
    transaction_update: VaultTransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a ledger entry."""
    existing = await vault_crud.get_transaction_by_id(db, transaction_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if existing.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    updated = await vault_crud.update_transaction(db, transaction_id=transaction_id, transaction_update=transaction_update)
    return updated


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vault_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a ledger entry."""
    existing = await vault_crud.get_transaction_by_id(db, transaction_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if existing.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    await vault_crud.delete_transaction(db, transaction_id=transaction_id)
    return None
