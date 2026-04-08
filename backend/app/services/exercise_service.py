from .llm.base import ExerciseGenerator


class ExerciseService:
    """Serviço de exercícios — delega para o gerador (estático ou LLM)."""

    def __init__(self, generator: ExerciseGenerator) -> None:
        self._generator = generator

    async def get_all(self) -> list:
        return await self._generator.get_all()

    async def get_by_module(self, module_id: str) -> list:
        return await self._generator.get_by_module(module_id)

    async def generate(self, module_id: str, count: int = 5) -> list:
        return await self._generator.generate(module_id, count)
