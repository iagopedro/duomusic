from fastapi import APIRouter

from ..services.achievement_service import AchievementService

router = APIRouter(prefix="/achievements", tags=["conquistas"])

_service = AchievementService()


@router.get("")
def list_achievements():
    """Retorna todas as conquistas disponíveis."""
    return [a.model_dump() for a in _service.get_all()]
