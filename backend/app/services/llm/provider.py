import json
import logging

from pydantic import TypeAdapter

from ...config import Settings
from ...data.exercises import EXERCISES
from ...models.exercise import Exercise
from .base import ExerciseGenerator
from .prompts import build_exercise_prompt

logger = logging.getLogger(__name__)


class StaticExerciseGenerator(ExerciseGenerator):
    """Retorna exercícios do banco estático (fallback)."""

    async def get_all(self) -> list:
        return list(EXERCISES)

    async def get_by_module(self, module_id: str) -> list:
        return [e for e in EXERCISES if e.module_id == module_id]

    async def generate(self, module_id: str, count: int = 5) -> list:
        return (await self.get_by_module(module_id))[:count]


class LLMExerciseGenerator(ExerciseGenerator):
    """Gera exercícios via LLM usando LangChain."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._fallback = StaticExerciseGenerator()
        self._llm = self._create_llm()
        self._adapter = TypeAdapter(list[Exercise])

    def _create_llm(self):
        provider = self._settings.llm_provider

        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI

            return ChatGoogleGenerativeAI(
                model=self._settings.llm_model,
                google_api_key=self._settings.llm_api_key,
                temperature=self._settings.llm_temperature,
            )

        if provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=self._settings.llm_model,
                api_key=self._settings.llm_api_key,
                temperature=self._settings.llm_temperature,
            )

        raise ValueError(f"Provedor LLM não suportado: {provider}")

    async def get_all(self) -> list:
        return await self._fallback.get_all()

    async def get_by_module(self, module_id: str) -> list:
        return await self._fallback.get_by_module(module_id)

    async def generate(self, module_id: str, count: int = 5) -> list:
        prompt = build_exercise_prompt(module_id, count)

        try:
            response = await self._llm.ainvoke(prompt)
            raw = json.loads(response.content)
            exercises = self._adapter.validate_python(raw)
            return exercises
        except Exception:
            logger.warning(
                "Falha na geração via LLM para módulo '%s', usando fallback estático.",
                module_id,
                exc_info=True,
            )
            return await self._fallback.get_by_module(module_id)
