from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Enum, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.models.User import UserModel

from app.db.models.base import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, 
    )

    last_ip = Column(
        String(255),
        nullable=True
    )

    refresh_token = Column(
        String(255),
        unique=True,
        nullable=False
    )

    refresh_token_expiry = Column(
        DateTime,
        nullable=False
    )

    user_agent = Column(
        String(512),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship(UserModel, back_populates="sessions")