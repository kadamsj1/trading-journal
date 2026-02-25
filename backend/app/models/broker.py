from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Broker(Base):
    __tablename__ = "brokers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # name: 'dhan', 'iifl'
    broker_name = Column(String, nullable=False)
    
    # Credentials
    client_id = Column(String, nullable=True) # Usually user_id for broker
    api_key = Column(String, nullable=True)
    api_secret = Column(Text, nullable=True)
    
    # Tokens (for Dhan persistent tokens or IIFL session tokens)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime(timezone=True), nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="brokers")
