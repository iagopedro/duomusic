"""Testes para os serviços de domínio."""

import json
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.data.achievements import ACHIEVEMENTS
from app.data.exercises import EXERCISES
from app.data.modules import MODULES
from app.models.exercise import IntervalExercise, RhythmExercise
from app.services.achievement_service import AchievementService
from app.services.exercise_service import ExerciseService
from app.services.llm.provider import LLMExerciseGenerator, StaticExerciseGenerator
from app.services.module_service import ModuleService


class TestModuleService:
    """Testes para ModuleService."""

    def setup_method(self):
        self.service = ModuleService()

    def test_get_all_retorna_todos_os_modulos(self):
        modulos = self.service.get_all()
        assert len(modulos) == len(MODULES)

    def test_get_all_retorna_lista_de_modules(self):
        from app.models.module import Module
        modulos = self.service.get_all()
        assert all(isinstance(m, Module) for m in modulos)

    def test_get_all_retorna_copia_independente(self):
        """Modificar o resultado não deve afetar o original."""
        modulos = self.service.get_all()
        modulos.clear()
        assert len(self.service.get_all()) == len(MODULES)

    def test_get_by_id_retorna_modulo_existente(self):
        modulo = self.service.get_by_id("fundamentals")
        assert modulo is not None
        assert modulo.id == "fundamentals"

    def test_get_by_id_retorna_none_para_id_inexistente(self):
        modulo = self.service.get_by_id("modulo-nao-existe")
        assert modulo is None

    def test_get_by_id_retorna_todos_os_modulos_conhecidos(self):
        ids_conhecidos = [m.id for m in MODULES]
        for module_id in ids_conhecidos:
            assert self.service.get_by_id(module_id) is not None

    def test_modulos_tem_ordem_crescente(self):
        modulos = self.service.get_all()
        ordens = [m.order for m in modulos]
        assert ordens == sorted(ordens)


class TestAchievementService:
    """Testes para AchievementService."""

    def setup_method(self):
        self.service = AchievementService()

    def test_get_all_retorna_todas_as_conquistas(self):
        conquistas = self.service.get_all()
        assert len(conquistas) == len(ACHIEVEMENTS)

    def test_get_all_retorna_lista_de_achievements(self):
        from app.models.achievement import Achievement
        conquistas = self.service.get_all()
        assert all(isinstance(a, Achievement) for a in conquistas)

    def test_get_all_retorna_copia_independente(self):
        conquistas = self.service.get_all()
        conquistas.clear()
        assert len(self.service.get_all()) == len(ACHIEVEMENTS)

    def test_conquistas_tem_ids_unicos(self):
        conquistas = self.service.get_all()
        ids = [a.id for a in conquistas]
        assert len(ids) == len(set(ids))


class TestStaticExerciseGenerator:
    """Testes para StaticExerciseGenerator."""

    def setup_method(self):
        self.generator = StaticExerciseGenerator()

    async def test_get_all_retorna_todos_exercicios(self):
        exercicios = await self.generator.get_all()
        assert len(exercicios) == len(EXERCISES)

    async def test_get_by_module_filtra_por_modulo(self):
        exercicios = await self.generator.get_by_module("fundamentals")
        assert all(e.module_id == "fundamentals" for e in exercicios)
        assert len(exercicios) > 0

    async def test_get_by_module_modulo_inexistente_retorna_vazio(self):
        exercicios = await self.generator.get_by_module("modulo-nao-existe")
        assert exercicios == []

    async def test_get_by_module_retorna_correto_para_cada_modulo(self):
        modulos = ["fundamentals", "intervals", "scales", "chords", "mixed"]
        for module_id in modulos:
            exercicios = await self.generator.get_by_module(module_id)
            assert all(e.module_id == module_id for e in exercicios), (
                f"Exercício com module_id errado no módulo {module_id}"
            )

    async def test_generate_respeita_count(self):
        exercicios = await self.generator.generate("fundamentals", count=3)
        assert len(exercicios) <= 3

    async def test_generate_count_maior_que_disponivel_retorna_todos(self):
        todos = await self.generator.get_by_module("fundamentals")
        exercicios = await self.generator.generate("fundamentals", count=1000)
        assert len(exercicios) == len(todos)

    async def test_generate_modulo_inexistente_retorna_vazio(self):
        exercicios = await self.generator.generate("nao-existe", count=5)
        assert exercicios == []


class TestExerciseService:
    """Testes para ExerciseService (fachada / delegação)."""

    async def test_get_all_delega_para_gerador(self):
        mock_generator = AsyncMock()
        mock_generator.get_all.return_value = [MagicMock()]
        service = ExerciseService(mock_generator)

        resultado = await service.get_all()

        mock_generator.get_all.assert_called_once()
        assert len(resultado) == 1

    async def test_get_by_module_delega_para_gerador(self):
        mock_generator = AsyncMock()
        mock_generator.get_by_module.return_value = []
        service = ExerciseService(mock_generator)

        await service.get_by_module("fundamentals")

        mock_generator.get_by_module.assert_called_once_with("fundamentals")

    async def test_generate_delega_para_gerador(self):
        mock_generator = AsyncMock()
        mock_generator.generate.return_value = []
        service = ExerciseService(mock_generator)

        await service.generate("intervals", 3)

        mock_generator.generate.assert_called_once_with("intervals", 3)


class TestLLMExerciseGenerator:
    """Testes para LLMExerciseGenerator."""

    def _make_settings(self, provider="gemini", **kwargs):
        from app.config import Settings
        return Settings(
            llm_enabled=True,
            llm_provider=provider,
            llm_api_key="fake-key",
            llm_model="gemini-2.0-flash",
            **kwargs,
        )

    def test_provider_invalido_levanta_valueerror(self):
        settings = self._make_settings(provider="provedor-invalido")
        with pytest.raises(ValueError, match="Provedor LLM não suportado"):
            LLMExerciseGenerator(settings)

    def test_provider_gemini_cria_llm(self):
        settings = self._make_settings(provider="gemini")
        mock_genai = MagicMock()
        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            assert gen._llm is not None
            mock_genai.ChatGoogleGenerativeAI.assert_called_once()

    def test_provider_openai_cria_llm(self):
        settings = self._make_settings(provider="openai")
        mock_openai = MagicMock()
        with patch.dict(sys.modules, {"langchain_openai": mock_openai}):
            gen = LLMExerciseGenerator(settings)
            assert gen._llm is not None
            mock_openai.ChatOpenAI.assert_called_once()

    async def test_get_all_delega_para_fallback(self):
        settings = self._make_settings()
        mock_genai = MagicMock()
        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.get_all()
            assert len(exercicios) == len(EXERCISES)

    async def test_get_by_module_delega_para_fallback(self):
        settings = self._make_settings()
        mock_genai = MagicMock()
        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.get_by_module("intervals")
            assert all(e.module_id == "intervals" for e in exercicios)

    async def test_generate_sucesso_retorna_exercicios_do_llm(self):
        settings = self._make_settings()
        exercicio_payload = [
            {
                "id": "i-gen-1", "moduleId": "intervals", "type": "interval",
                "difficulty": 1, "xpReward": 15, "conceptKey": "c", "questionKey": "q",
                "rootFreq": 261.63, "semitones": 4, "options": [3, 4, 5],
            }
        ]
        mock_llm_instance = AsyncMock()
        mock_llm_instance.ainvoke.return_value = MagicMock(
            content=json.dumps(exercicio_payload)
        )
        mock_genai = MagicMock()
        mock_genai.ChatGoogleGenerativeAI.return_value = mock_llm_instance

        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.generate("intervals", 1)

        assert len(exercicios) == 1
        assert isinstance(exercicios[0], IntervalExercise)
        assert exercicios[0].id == "i-gen-1"

    async def test_generate_falha_llm_usa_fallback(self):
        settings = self._make_settings()
        mock_llm_instance = AsyncMock()
        mock_llm_instance.ainvoke.side_effect = Exception("Timeout da API")
        mock_genai = MagicMock()
        mock_genai.ChatGoogleGenerativeAI.return_value = mock_llm_instance

        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.generate("intervals", 5)

        assert len(exercicios) > 0
        assert all(e.module_id == "intervals" for e in exercicios)

    async def test_generate_json_invalido_usa_fallback(self):
        settings = self._make_settings()
        mock_llm_instance = AsyncMock()
        mock_llm_instance.ainvoke.return_value = MagicMock(
            content="não é JSON válido {{{"
        )
        mock_genai = MagicMock()
        mock_genai.ChatGoogleGenerativeAI.return_value = mock_llm_instance

        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.generate("fundamentals", 3)

        assert len(exercicios) > 0
        assert all(e.module_id == "fundamentals" for e in exercicios)

    async def test_generate_schema_invalido_usa_fallback(self):
        """LLM retorna JSON válido mas com schema incorreto → fallback."""
        settings = self._make_settings()
        payload_invalido = [{"id": "x-1", "tipo": "ritmo_errado"}]
        mock_llm_instance = AsyncMock()
        mock_llm_instance.ainvoke.return_value = MagicMock(
            content=json.dumps(payload_invalido)
        )
        mock_genai = MagicMock()
        mock_genai.ChatGoogleGenerativeAI.return_value = mock_llm_instance

        with patch.dict(sys.modules, {"langchain_google_genai": mock_genai}):
            gen = LLMExerciseGenerator(settings)
            exercicios = await gen.generate("chords", 2)

        assert len(exercicios) > 0
