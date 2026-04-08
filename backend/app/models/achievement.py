from typing import Literal

from .base import CamelModel


class AchievementCondition(CamelModel):
    type: Literal["xp", "streak", "module_complete", "exercises_done", "accuracy"]
    value: int
    module_id: str | None = None


class Achievement(CamelModel):
    id: str
    icon: str
    title_key: str
    description_key: str
    condition: AchievementCondition
