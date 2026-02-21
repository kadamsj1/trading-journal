from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class AlertCondition(str, enum.Enum):
    ABOVE = "above"
    BELOW = "below"
    CROSSING = "crossing"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Alert details
    symbol = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    condition = Column(Enum(AlertCondition), nullable=False, default=AlertCondition.ABOVE)
    message = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="alerts")
