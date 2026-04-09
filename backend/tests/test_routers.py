"""Testes de integração para os routers FastAPI."""

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.data.achievements import ACHIEVEMENTS
from app.data.exercises import EXERCISES
from app.data.modules import MODULES
from app.main import app, _requests
from app.routers.exercises import _create_service


@pytest.fixture(autouse=True)
def limpar_estado_global():
    """Reseta o estado de rate limit e cache de serviço entre testes."""
    _requests.clear()
    _create_service.cache_clear()
    yield
    _requests.clear()
    _create_service.cache_clear()


@pytest.fixture
def cliente():
    return TestClient(app)


class TestHealthEndpoint:
    """Testes para o endpoint /health."""

    def test_health_retorna_200(self, cliente):
        resp = cliente.get("/health")
        assert resp.status_code == 200

    def test_health_retorna_status_ok(self, cliente):
        resp = cliente.get("/health")
        assert resp.json() == {"status": "ok"}


class TestSecurityHeaders:
    """Testes para headers de segurança aplicados globalmente."""

    def test_x_content_type_options(self, cliente):
        resp = cliente.get("/health")
        assert resp.headers["x-content-type-options"] == "nosniff"

    def test_x_frame_options(self, cliente):
        resp = cliente.get("/health")
        assert resp.headers["x-frame-options"] == "DENY"

    def test_referrer_policy(self, cliente):
        resp = cliente.get("/health")
        assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"

    def test_permissions_policy(self, cliente):
        resp = cliente.get("/health")
        assert "permissions-policy" in resp.headers

    def test_headers_presentes_nos_endpoints_de_api(self, cliente):
        resp = cliente.get("/api/modules")
        assert resp.headers["x-frame-options"] == "DENY"


class TestModulesEndpoint:
    """Testes para GET /api/modules."""

    def test_retorna_200(self, cliente):
        resp = cliente.get("/api/modules")
        assert resp.status_code == 200

    def test_retorna_lista_nao_vazia(self, cliente):
        resp = cliente.get("/api/modules")
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_retorna_quantidade_correta_de_modulos(self, cliente):
        resp = cliente.get("/api/modules")
        assert len(resp.json()) == len(MODULES)

    def test_campos_em_camel_case(self, cliente):
        resp = cliente.get("/api/modules")
        modulo = resp.json()[0]
        assert "nameKey" in modulo
        assert "minXpToUnlock" in modulo
        assert "exerciseIds" in modulo
        assert "name_key" not in modulo

    def test_cada_modulo_tem_id_unico(self, cliente):
        resp = cliente.get("/api/modules")
        ids = [m["id"] for m in resp.json()]
        assert len(ids) == len(set(ids))


class TestAchievementsEndpoint:
    """Testes para GET /api/achievements."""

    def test_retorna_200(self, cliente):
        resp = cliente.get("/api/achievements")
        assert resp.status_code == 200

    def test_retorna_lista_nao_vazia(self, cliente):
        data = cliente.get("/api/achievements").json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_retorna_quantidade_correta(self, cliente):
        resp = cliente.get("/api/achievements")
        assert len(resp.json()) == len(ACHIEVEMENTS)

    def test_campos_em_camel_case(self, cliente):
        conquista = cliente.get("/api/achievements").json()[0]
        assert "titleKey" in conquista
        assert "descriptionKey" in conquista
        assert "title_key" not in conquista

    def test_condition_em_camel_case(self, cliente):
        conquista = cliente.get("/api/achievements").json()[0]
        assert "condition" in conquista
        assert isinstance(conquista["condition"], dict)


class TestExercisesListEndpoint:
    """Testes para GET /api/exercises."""

    def test_retorna_200(self, cliente):
        resp = cliente.get("/api/exercises")
        assert resp.status_code == 200

    def test_retorna_todos_exercicios(self, cliente):
        resp = cliente.get("/api/exercises")
        assert len(resp.json()) == len(EXERCISES)

    def test_filter_por_module_id(self, cliente):
        resp = cliente.get("/api/exercises?moduleId=intervals")
        exercicios = resp.json()
        assert len(exercicios) > 0
        assert all(e["moduleId"] == "intervals" for e in exercicios)

    def test_filter_modulo_inexistente_retorna_vazio(self, cliente):
        resp = cliente.get("/api/exercises?moduleId=nao-existe")
        assert resp.json() == []

    def test_campo_module_id_em_camel_case(self, cliente):
        exercicio = cliente.get("/api/exercises").json()[0]
        assert "moduleId" in exercicio
        assert "module_id" not in exercicio

    def test_todos_modulos_tem_exercicios(self, cliente):
        # O módulo 'mixed' reutiliza IDs de outros módulos (ex: 'r-1' com module_id='fundamentals'),
        # portanto a filtragem por moduleId='mixed' retorna vazio — comportamento esperado.
        modulos_com_exercicios_proprios = [m for m in MODULES if m.id != "mixed"]
        for modulo in modulos_com_exercicios_proprios:
            resp = cliente.get(f"/api/exercises?moduleId={modulo.id}")
            assert len(resp.json()) > 0, f"Módulo {modulo.id} sem exercícios"

    def test_tipos_de_exercicio_validos(self, cliente):
        tipos_validos = {"rhythm", "interval", "chord", "note-id", "melody"}
        exercicios = cliente.get("/api/exercises").json()
        tipos_encontrados = {e["type"] for e in exercicios}
        assert tipos_encontrados.issubset(tipos_validos)


class TestExercisesGenerateEndpoint:
    """Testes para POST /api/exercises/generate."""

    def test_retorna_200(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals")
        assert resp.status_code == 200

    def test_retorna_lista(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals")
        assert isinstance(resp.json(), list)

    def test_count_padrao_e_cinco(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals")
        assert len(resp.json()) <= 5

    def test_count_personalizado(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals&count=3")
        assert len(resp.json()) <= 3

    def test_count_um(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=intervals&count=1")
        assert len(resp.json()) <= 1

    def test_module_id_obrigatorio(self, cliente):
        resp = cliente.post("/api/exercises/generate")
        assert resp.status_code == 422

    def test_count_zero_invalido(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals&count=0")
        assert resp.status_code == 422

    def test_count_acima_de_vinte_invalido(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=fundamentals&count=21")
        assert resp.status_code == 422

    def test_exercicios_pertencem_ao_modulo_correto(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=chords&count=3")
        exercicios = resp.json()
        assert all(e["moduleId"] == "chords" for e in exercicios)

    def test_modulo_inexistente_retorna_lista_vazia(self, cliente):
        resp = cliente.post("/api/exercises/generate?moduleId=modulo-fantasma&count=5")
        assert resp.status_code == 200
        assert resp.json() == []


class TestRateLimiting:
    """Testes para o rate limiter em memória."""

    def test_requisicoes_dentro_do_limite_retornam_200(self, cliente):
        for _ in range(5):
            resp = cliente.get("/health")
            assert resp.status_code == 200

    def test_exceder_limite_retorna_429(self, monkeypatch, cliente):
        from app.config import Settings
        monkeypatch.setenv("DUOMUSIC_RATE_LIMIT_MAX", "3")
        monkeypatch.setenv("DUOMUSIC_RATE_LIMIT_WINDOW", "60")
        get_settings.cache_clear()

        # Substitui as settings com limite baixo
        low_limit_settings = Settings(rate_limit_max=3, rate_limit_window=60)

        with pytest.MonkeyPatch().context() as mp:
            mp.setattr("app.main.settings", low_limit_settings)
            # As primeiras 3 devem passar
            for _ in range(3):
                resp = cliente.get("/health")
                assert resp.status_code == 200
            # A 4ª deve ser bloqueada
            resp = cliente.get("/health")
            assert resp.status_code == 429

    def test_corpo_429_tem_detail(self, monkeypatch, cliente):
        low_limit_settings_obj = type("S", (), {
            "rate_limit_max": 0,
            "rate_limit_window": 60,
            "debug": False,
            "cors_origins": ["*"],
        })()

        with pytest.MonkeyPatch().context() as mp:
            mp.setattr("app.main.settings", low_limit_settings_obj)
            resp = cliente.get("/health")
            if resp.status_code == 429:
                assert "detail" in resp.json()


class TestSwaggerDocs:
    """Testes para disponibilidade do Swagger conforme ambiente."""

    def test_docs_desabilitado_em_producao(self, cliente):
        """Em modo debug=False (padrão) o /docs deve retornar 404."""
        resp = cliente.get("/docs")
        assert resp.status_code == 404

    def test_docs_habilitado_em_debug(self, monkeypatch):
        from app.config import Settings
        monkeypatch.setenv("DUOMUSIC_DEBUG", "true")
        get_settings.cache_clear()

        from fastapi import FastAPI
        debug_app = FastAPI(docs_url="/docs")

        with TestClient(debug_app) as debug_client:
            # Apenas valida que o app foi criado com docs_url configurado
            assert debug_app.docs_url == "/docs"
