from .base import CamelModel


class Module(CamelModel):
    id: str
    name_key: str
    description: str
    icon: str
    color: str
    order: int
    required_module_id: str | None = None
    min_xp_to_unlock: int
    exercise_ids: list[str]
