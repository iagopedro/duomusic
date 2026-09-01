"""Modelo SQLAlchemy para progresso do usuário."""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .db_user import User


class UserProgress(Base):
    """Modelo de progresso do usuário no banco de dados."""

    __tablename__ = "user_progress"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_practice_date: Mapped[date | None] = mapped_column(Date)
    unlocked_module_ids: Mapped[list] = mapped_column(
        JSON, default=lambda: ["fundamentals"]
    )
    completed_module_ids: Mapped[list] = mapped_column(JSON, default=list)
    earned_achievement_ids: Mapped[list] = mapped_column(JSON, default=list)
    daily_missions: Mapped[list] = mapped_column(JSON, default=list)
    daily_missions_date: Mapped[date | None] = mapped_column(Date)
    total_practice_ms: Mapped[int] = mapped_column(BigInteger, default=0)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relacionamento
    user: Mapped["User"] = relationship(back_populates="progress")

    def __repr__(self) -> str:
        return f"<UserProgress user_id={self.user_id} xp={self.xp}>"
