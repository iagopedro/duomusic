from ..data.achievements import ACHIEVEMENTS
from ..models.achievement import Achievement


class AchievementService:
    """Serviço de conquistas — acesso centralizado aos dados de conquistas."""

    def get_all(self) -> list[Achievement]:
        return list(ACHIEVEMENTS)
