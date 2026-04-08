from fastapi import APIRouter

from ..services.module_service import ModuleService

router = APIRouter(prefix="/modules", tags=["módulos"])

_service = ModuleService()


@router.get("")
def list_modules():
    """Retorna todos os módulos disponíveis."""
    return [m.model_dump() for m in _service.get_all()]
