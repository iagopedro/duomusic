from fastapi import APIRouter, Depends, Query

from ..config import get_settings
from ..services.exercise_service import ExerciseService
from ..services.llm.provider import LLMExerciseGenerator, StaticExerciseGenerator

router = APIRouter(prefix="/exercises", tags=["exercícios"])


def get_exercise_service() -> ExerciseService:
    settings = get_settings()
    generator = (
        LLMExerciseGenerator(settings) if settings.llm_enabled else StaticExerciseGenerator()
    )
    return ExerciseService(generator)


@router.get("")
async def list_exercises(
    module_id: str | None = Query(None, alias="moduleId"),
    service: ExerciseService = Depends(get_exercise_service),
):
    """Retorna exercícios. Filtra por módulo se moduleId informado."""
    if module_id:
        exercises = await service.get_by_module(module_id)
    else:
        exercises = await service.get_all()
    return [e.model_dump() for e in exercises]


@router.post("/generate")
async def generate_exercises(
    module_id: str = Query(..., alias="moduleId"),
    count: int = Query(5, ge=1, le=20),
    service: ExerciseService = Depends(get_exercise_service),
):
    """Gera exercícios via LLM (ou fallback estático)."""
    exercises = await service.generate(module_id, count)
    return [e.model_dump() for e in exercises]
