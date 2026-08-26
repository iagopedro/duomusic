"""Modelo SQLAlchemy para histórico de exercícios."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .db_user import User


class ExerciseHistory(Base):
    """Modelo de histórico de exercícios no banco de dados."""

    __tablename__ = "exercise_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[str] = mapped_column(String(50), nullable=False)
    module_id: Mapped[str] = mapped_column(String(50), nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relacionamento
    user: Mapped["User"] = relationship(back_populates="exercise_history")

    def __repr__(self) -> str:
        return f"<ExerciseHistory exercise_id={self.exercise_id} correct={self.correct}>"
