"""Serviço de progresso do usuário."""

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.schemas import ExerciseResultCreate, ProgressSync
from ..models.db_exercise_history import ExerciseHistory
from ..models.db_user_progress import UserProgress


class UserProgressService:
    """Serviço para operações com progresso do usuário."""

    def __init__(self, db: AsyncSession):
        """Inicializa o serviço com uma sessão do banco."""
        self.db = db

    async def get_progress(self, user_id: str) -> UserProgress | None:
        """
        Obtém o progresso do usuário.
        
        Args:
            user_id: ID do usuário.
            
        Returns:
            Progresso do usuário ou None.
        """
        result = await self.db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def sync_progress(
        self, user_id: str, progress_data: ProgressSync
    ) -> UserProgress:
        """
        Sincroniza o progresso do usuário.
        
        Estratégia de merge: maior XP vence, achievements são unidos.
        
        Args:
            user_id: ID do usuário.
            progress_data: Dados do progresso do cliente.
            
        Returns:
            Progresso atualizado.
        """
        progress = await self.get_progress(user_id)

        if progress is None:
            # Cria novo progresso
            progress = UserProgress(
                user_id=user_id,
                xp=progress_data.xp,
                level=progress_data.level,
                streak=progress_data.streak,
                last_practice_date=self._parse_date(progress_data.last_practice_date),
                unlocked_module_ids=progress_data.unlocked_module_ids,
                completed_module_ids=progress_data.completed_module_ids,
                earned_achievement_ids=progress_data.earned_achievement_ids,
                daily_missions=progress_data.daily_missions,
                daily_missions_date=self._parse_date(progress_data.daily_missions_date),
                total_practice_ms=progress_data.total_practice_ms,
            )
            self.db.add(progress)
        else:
            # Merge: maior XP vence
            if progress_data.xp > progress.xp:
                progress.xp = progress_data.xp
                progress.level = progress_data.level
                progress.total_practice_ms = progress_data.total_practice_ms

            # Maior streak vence
            if progress_data.streak > progress.streak:
                progress.streak = progress_data.streak
                progress.last_practice_date = self._parse_date(
                    progress_data.last_practice_date
                )

            # União de módulos desbloqueados
            server_unlocked = set(progress.unlocked_module_ids or [])
            client_unlocked = set(progress_data.unlocked_module_ids or [])
            progress.unlocked_module_ids = list(server_unlocked | client_unlocked)

            # União de módulos completados
            server_completed = set(progress.completed_module_ids or [])
            client_completed = set(progress_data.completed_module_ids or [])
            progress.completed_module_ids = list(server_completed | client_completed)

            # União de achievements
            server_achievements = set(progress.earned_achievement_ids or [])
            client_achievements = set(progress_data.earned_achievement_ids or [])
            progress.earned_achievement_ids = list(
                server_achievements | client_achievements
            )

            # Daily missions: usa os do cliente se a data for mais recente
            client_date = self._parse_date(progress_data.daily_missions_date)
            if client_date and (
                progress.daily_missions_date is None
                or client_date > progress.daily_missions_date
            ):
                progress.daily_missions = progress_data.daily_missions
                progress.daily_missions_date = client_date

        progress.synced_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(progress)

        return progress

    async def add_exercise_result(
        self, user_id: str, result_data: ExerciseResultCreate
    ) -> ExerciseHistory:
        """
        Adiciona um resultado de exercício ao histórico.
        
        Args:
            user_id: ID do usuário.
            result_data: Dados do resultado.
            
        Returns:
            Resultado criado.
        """
        history = ExerciseHistory(
            user_id=user_id,
            exercise_id=result_data.exercise_id,
            module_id=result_data.module_id,
            correct=result_data.correct,
            xp_earned=result_data.xp_earned,
            attempted_at=result_data.attempted_at,
            duration_ms=result_data.duration_ms,
        )

        self.db.add(history)
        await self.db.flush()
        await self.db.refresh(history)

        return history

    async def get_exercise_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ExerciseHistory]:
        """
        Obtém o histórico de exercícios do usuário.
        
        Args:
            user_id: ID do usuário.
            limit: Máximo de resultados.
            offset: Offset para paginação.
            
        Returns:
            Lista de resultados.
        """
        result = await self.db.execute(
            select(ExerciseHistory)
            .where(ExerciseHistory.user_id == user_id)
            .order_by(ExerciseHistory.attempted_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    def _parse_date(self, date_str: str | None) -> date | None:
        """Converte string ISO para date."""
        if date_str is None:
            return None
        try:
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None
