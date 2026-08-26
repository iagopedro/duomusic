"""Schemas Pydantic para autenticação."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Modelo base com serialização camelCase."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class UserCreate(CamelModel):
    """Schema para criação de usuário."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=50)


class UserLogin(CamelModel):
    """Schema para login de usuário."""

    email: EmailStr
    password: str


class Token(CamelModel):
    """Schema para resposta de tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos até expirar


class TokenRefresh(CamelModel):
    """Schema para refresh de token."""

    refresh_token: str


class UserResponse(CamelModel):
    """Schema para resposta de dados do usuário."""

    id: str
    email: str
    display_name: str | None
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserUpdate(CamelModel):
    """Schema para atualização de usuário."""

    display_name: str | None = Field(default=None, max_length=50)


class ProgressSync(CamelModel):
    """Schema para sincronização de progresso."""

    xp: int = 0
    level: int = 1
    streak: int = 0
    last_practice_date: str | None = None
    unlocked_module_ids: list[str] = Field(default_factory=lambda: ["fundamentals"])
    completed_module_ids: list[str] = Field(default_factory=list)
    earned_achievement_ids: list[str] = Field(default_factory=list)
    daily_missions: list[dict] = Field(default_factory=list)
    daily_missions_date: str | None = None
    total_practice_ms: int = 0


class ProgressResponse(ProgressSync):
    """Schema para resposta de progresso."""

    synced_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ExerciseResultCreate(CamelModel):
    """Schema para criar resultado de exercício."""

    exercise_id: str
    module_id: str
    correct: bool
    xp_earned: int
    attempted_at: datetime
    duration_ms: int


class ExerciseResultResponse(ExerciseResultCreate):
    """Schema para resposta de resultado de exercício."""

    id: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
