from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.broker import Broker
from app.schemas.broker import BrokerCreate, BrokerUpdate
from typing import List, Optional

async def get_user_brokers(db: AsyncSession, user_id: int) -> List[Broker]:
    result = await db.execute(select(Broker).where(Broker.user_id == user_id))
    return list(result.scalars().all())

async def get_broker_by_id(db: AsyncSession, broker_id: int) -> Optional[Broker]:
    result = await db.execute(select(Broker).where(Broker.id == broker_id))
    return result.scalars().first()

async def create_broker(db: AsyncSession, broker: BrokerCreate, user_id: int) -> Broker:
    db_broker = Broker(**broker.model_dump(), user_id=user_id)
    db.add(db_broker)
    await db.commit()
    await db.refresh(db_broker)
    return db_broker

async def update_broker(db: AsyncSession, broker_id: int, broker_update: BrokerUpdate) -> Optional[Broker]:
    db_broker = await get_broker_by_id(db, broker_id)
    if not db_broker:
        return None
    
    update_data = broker_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_broker, key, value)
    
    await db.commit()
    await db.refresh(db_broker)
    return db_broker

async def delete_broker(db: AsyncSession, broker_id: int) -> bool:
    db_broker = await get_broker_by_id(db, broker_id)
    if not db_broker:
        return False
    
    await db.delete(db_broker)
    await db.commit()
    return True

async def get_broker_by_client_id(db: AsyncSession, client_id: str) -> Optional[Broker]:
    result = await db.execute(select(Broker).where(Broker.client_id == client_id))
    return result.scalars().first()
