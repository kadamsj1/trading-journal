from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.database import get_db
from app.auth.dependencies import get_current_active_user
from app.models import User, DailyCharge
from app.models.portfolio import Portfolio
from app.schemas.daily_charge import DailyChargeCreate, DailyChargeUpdate, DailyChargeResponse

router = APIRouter(prefix="/charges", tags=["charges"])


async def verify_portfolio_ownership(portfolio_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return portfolio


@router.post("/", response_model=DailyChargeResponse, status_code=201)
async def create_daily_charge(
    charge: DailyChargeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add or update daily charges for a portfolio date"""
    await verify_portfolio_ownership(charge.portfolio_id, current_user.id, db)

    # Check if a record already exists for this date — upsert behaviour
    result = await db.execute(
        select(DailyCharge).where(
            and_(
                DailyCharge.portfolio_id == charge.portfolio_id,
                DailyCharge.date == charge.date,
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.amount = charge.amount
        existing.notes = charge.notes
        await db.commit()
        await db.refresh(existing)
        return existing

    db_charge = DailyCharge(**charge.model_dump())
    db.add(db_charge)
    await db.commit()
    await db.refresh(db_charge)
    return db_charge


@router.get("/portfolio/{portfolio_id}", response_model=List[DailyChargeResponse])
async def get_daily_charges(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all daily charges for a portfolio, sorted by date desc"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    result = await db.execute(
        select(DailyCharge)
        .where(DailyCharge.portfolio_id == portfolio_id)
        .order_by(DailyCharge.date.desc())
    )
    return list(result.scalars().all())


@router.patch("/{charge_id}", response_model=DailyChargeResponse)
async def update_daily_charge(
    charge_id: int,
    update: DailyChargeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(DailyCharge).where(DailyCharge.id == charge_id))
    charge = result.scalar_one_or_none()
    if not charge:
        raise HTTPException(status_code=404, detail="Charge record not found")
    await verify_portfolio_ownership(charge.portfolio_id, current_user.id, db)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(charge, field, value)
    await db.commit()
    await db.refresh(charge)
    return charge


@router.delete("/{charge_id}", status_code=204)
async def delete_daily_charge(
    charge_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(DailyCharge).where(DailyCharge.id == charge_id))
    charge = result.scalar_one_or_none()
    if not charge:
        raise HTTPException(status_code=404, detail="Charge record not found")
    await verify_portfolio_ownership(charge.portfolio_id, current_user.id, db)
    await db.delete(charge)
    await db.commit()
