from sqlalchemy import Column, Integer, Float, Date, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DailyCharge(Base):
    __tablename__ = "daily_charges"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)

    # Core fields
    date = Column(Date, nullable=False, index=True)         # The trading date
    amount = Column(Float, nullable=False)                   # Total charges for the day
    notes = Column(Text, nullable=True)                      # Optional: brokerage, STT, GST etc.

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    portfolio = relationship("Portfolio", back_populates="daily_charges")
