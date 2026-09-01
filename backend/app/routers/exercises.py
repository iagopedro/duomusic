from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from ..config import get_settings
from ..services.exercise_service import ExerciseService
from ..services.llm.provider import LLMExerciseGenerator, StaticExerciseGenerator
from ..utils.security import ALLOWED_MODULE_IDS, PromptInjectionError, validate_module_id

router = APIRouter(prefix="/exercises", tags=["exercícios"])


@lru_cache
def _create_service() -> ExerciseService:
    settings = get_settings()
    generator = (
        LLMExerciseGenerator(settings) if settings.llm_enabled else StaticExerciseGenerator()
    )
    return ExerciseService(generator)


@router.get("")
async def list_exercises(
    module_id: str | None = Query(None, alias="moduleId"),
    service: ExerciseService = Depends(_create_service),
):
    """Retorna exercícios. Filtra por módulo se moduleId informado."""
    if module_id:
        # Valida module_id mesmo para operações de leitura (defesa em profundidade)
        try:
            safe_module_id = validate_module_id(module_id)
        except PromptInjectionError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        exercises = await service.get_by_module(safe_module_id)
    else:
        exercises = await service.get_all()
    return [e.model_dump() for e in exercises]


def _validate_module_id_param(module_id: str = Query(..., alias="moduleId")) -> str:
    """Valida module_id contra prompt injection antes de processar."""
    try:
        return validate_module_id(module_id)
    except PromptInjectionError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


ValidModuleId = Annotated[str, Depends(_validate_module_id_param)]


@router.post("/generate")
async def generate_exercises(
    module_id: ValidModuleId,
    count: int = Query(5, ge=1, le=20),
    service: ExerciseService = Depends(_create_service),
):
    """
    Gera exercícios via LLM (ou fallback estático).

    O module_id é validado contra uma whitelist para prevenir prompt injection.
    Valores permitidos: fundamentals, intervals, scales, chords, mixed.
    """
    exercises = await service.generate(module_id, count)
    return [e.model_dump() for e in exercises]
