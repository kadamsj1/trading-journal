from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.schemas.alert import Alert, AlertCreate, AlertUpdate
from app.crud import alert as alert_crud
from app.auth.dependencies import get_current_active_user
from app.models import User

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=List[Alert])
async def get_alerts(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await alert_crud.get_user_alerts(db, user_id=current_user.id, active_only=active_only)


@router.post("/", response_model=Alert, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await alert_crud.create_alert(db, alert=alert, user_id=current_user.id)


@router.get("/{alert_id}", response_model=Alert)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = await alert_crud.get_alert_by_id(db, alert_id)
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=Alert)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = await alert_crud.get_alert_by_id(db, alert_id)
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return await alert_crud.update_alert(db, alert_id, alert_update)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = await alert_crud.get_alert_by_id(db, alert_id)
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    success = await alert_crud.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete alert")
    return None
