from abc import ABC, abstractmethod


class ExerciseGenerator(ABC):
    """Interface abstrata para geração de exercícios (Strategy Pattern)."""

    @abstractmethod
    async def get_all(self) -> list:
        """Retorna todos os exercícios disponíveis."""

    @abstractmethod
    async def get_by_module(self, module_id: str) -> list:
        """Retorna exercícios filtrados por módulo."""

    @abstractmethod
    async def generate(self, module_id: str, count: int = 5) -> list:
        """Gera exercícios (estáticos ou via LLM)."""
