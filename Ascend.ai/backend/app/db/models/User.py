from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Enum, Uuid
from sqlalchemy.orm import relationship
import uuid
from enum import Enum as pyEnum
from app.db.models.base import Base

class UserRole(pyEnum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(
        Uuid(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False
    )
    hashed_password = Column(
        String(255),
        nullable=False
    )

    email = Column(
        String(255),
        nullable=False,
        unique=True
    )

    role = Column(
        Enum(UserRole),
        default=UserRole.USER,
        nullable=False
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    email_verification_token = Column(
        String(255),
        unique=True,
        nullable=True
    )

    email_verification_expiry = Column(
        DateTime,
        nullable=True
    )

    forgot_password_token = Column(
        String(255),
        unique=True,
        nullable=True
    )

    forgot_password_token_expiry = Column(
        DateTime,
        nullable=True
    )

    sessions = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )