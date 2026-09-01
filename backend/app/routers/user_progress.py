"""Router de progresso do usuário."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_active_user
from ..auth.schemas import (
    ExerciseResultCreate,
    ExerciseResultResponse,
    ProgressResponse,
    ProgressSync,
)
from ..database import get_db
from ..models.db_user import User
from ..services.user_progress_service import UserProgressService

router = APIRouter(prefix="/users/me", tags=["user-progress"])


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtém o progresso do usuário autenticado.
    
    Returns:
        Progresso atual.
    """
    service = UserProgressService(db)
    progress = await service.get_progress(current_user.id)

    if progress is None:
        # Retorna progresso padrão se não existir
        return ProgressResponse(
            xp=0,
            level=1,
            streak=0,
            last_practice_date=None,
            unlocked_module_ids=["fundamentals"],
            completed_module_ids=[],
            earned_achievement_ids=[],
            daily_missions=[],
            daily_missions_date=None,
            total_practice_ms=0,
            synced_at=None,
        )

    return ProgressResponse(
        xp=progress.xp,
        level=progress.level,
        streak=progress.streak,
        last_practice_date=(
            progress.last_practice_date.isoformat()
            if progress.last_practice_date
            else None
        ),
        unlocked_module_ids=progress.unlocked_module_ids or ["fundamentals"],
        completed_module_ids=progress.completed_module_ids or [],
        earned_achievement_ids=progress.earned_achievement_ids or [],
        daily_missions=progress.daily_missions or [],
        daily_missions_date=(
            progress.daily_missions_date.isoformat()
            if progress.daily_missions_date
            else None
        ),
        total_practice_ms=progress.total_practice_ms,
        synced_at=progress.synced_at,
    )


@router.put("/progress", response_model=ProgressResponse)
async def sync_progress(
    progress_data: ProgressSync,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sincroniza o progresso do usuário.
    
    Estratégia de merge:
    - XP: maior valor vence
    - Streak: maior valor vence
    - Módulos/Achievements: união dos conjuntos
    - Daily missions: dados mais recentes vencem
    
    Returns:
        Progresso atualizado.
    """
    service = UserProgressService(db)
    progress = await service.sync_progress(current_user.id, progress_data)

    return ProgressResponse(
        xp=progress.xp,
        level=progress.level,
        streak=progress.streak,
        last_practice_date=(
            progress.last_practice_date.isoformat()
            if progress.last_practice_date
            else None
        ),
        unlocked_module_ids=progress.unlocked_module_ids or ["fundamentals"],
        completed_module_ids=progress.completed_module_ids or [],
        earned_achievement_ids=progress.earned_achievement_ids or [],
        daily_missions=progress.daily_missions or [],
        daily_missions_date=(
            progress.daily_missions_date.isoformat()
            if progress.daily_missions_date
            else None
        ),
        total_practice_ms=progress.total_practice_ms,
        synced_at=progress.synced_at,
    )


@router.get("/history", response_model=list[ExerciseResultResponse])
async def get_exercise_history(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtém o histórico de exercícios do usuário.
    
    Args:
        limit: Máximo de resultados (1-100).
        offset: Offset para paginação.
        
    Returns:
        Lista de resultados de exercícios.
    """
    service = UserProgressService(db)
    history = await service.get_exercise_history(current_user.id, limit, offset)

    return [
        ExerciseResultResponse(
            id=h.id,
            exercise_id=h.exercise_id,
            module_id=h.module_id,
            correct=h.correct,
            xp_earned=h.xp_earned,
            attempted_at=h.attempted_at,
            duration_ms=h.duration_ms,
        )
        for h in history
    ]


@router.post("/history", response_model=ExerciseResultResponse)
async def add_exercise_result(
    result_data: ExerciseResultCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Adiciona um resultado de exercício ao histórico.
    
    Returns:
        Resultado criado.
    """
    service = UserProgressService(db)
    result = await service.add_exercise_result(current_user.id, result_data)

    return ExerciseResultResponse(
        id=result.id,
        exercise_id=result.exercise_id,
        module_id=result.module_id,
        correct=result.correct,
        xp_earned=result.xp_earned,
        attempted_at=result.attempted_at,
        duration_ms=result.duration_ms,
    )
