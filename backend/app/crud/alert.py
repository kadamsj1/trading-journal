from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Alert
from app.schemas.alert import AlertCreate, AlertUpdate
from typing import Optional, List


async def get_alert_by_id(db: AsyncSession, alert_id: int) -> Optional[Alert]:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    return result.scalar_one_or_none()


async def get_user_alerts(
    db: AsyncSession,
    user_id: int,
    active_only: bool = False
) -> List[Alert]:
    query = select(Alert).where(Alert.user_id == user_id)
    if active_only:
        query = query.where(Alert.is_active == True)
    result = await db.execute(query.order_by(Alert.created_at.desc()))
    return list(result.scalars().all())


async def create_alert(db: AsyncSession, alert: AlertCreate, user_id: int) -> Alert:
    db_alert = Alert(**alert.model_dump(), user_id=user_id)
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    return db_alert


async def update_alert(
    db: AsyncSession,
    alert_id: int,
    alert_update: AlertUpdate
) -> Optional[Alert]:
    db_alert = await get_alert_by_id(db, alert_id)
    if not db_alert:
        return None

    update_data = alert_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_alert, field, value)

    await db.commit()
    await db.refresh(db_alert)
    return db_alert


async def delete_alert(db: AsyncSession, alert_id: int) -> bool:
    db_alert = await get_alert_by_id(db, alert_id)
    if not db_alert:
        return False

    await db.delete(db_alert)
    await db.commit()
    return True
