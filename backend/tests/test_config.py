"""Testes para as configurações da aplicação."""

import pytest

from app.config import Settings, get_settings


class TestSettings:
    """Testes para os valores padrão e carregamento de Settings."""

    def test_valores_padrao(self):
        settings = Settings()
        assert settings.debug is False
        assert settings.cors_origins == ["http://localhost:4200"]
        assert settings.llm_enabled is False
        assert settings.llm_provider == "gemini"
        assert settings.llm_api_key == ""
        assert settings.llm_model == "gemini-2.0-flash"
        assert settings.llm_temperature == pytest.approx(0.7)
        assert settings.llm_max_tokens == 2048
        assert settings.rate_limit_max == 60
        assert settings.rate_limit_window == 60

    def test_override_via_env(self, monkeypatch):
        monkeypatch.setenv("DUOMUSIC_DEBUG", "true")
        monkeypatch.setenv("DUOMUSIC_LLM_ENABLED", "true")
        monkeypatch.setenv("DUOMUSIC_LLM_API_KEY", "chave-teste")
        monkeypatch.setenv("DUOMUSIC_RATE_LIMIT_MAX", "30")

        settings = Settings()
        assert settings.debug is True
        assert settings.llm_enabled is True
        assert settings.llm_api_key == "chave-teste"
        assert settings.rate_limit_max == 30

    def test_cors_origins_lista_via_env(self, monkeypatch):
        monkeypatch.setenv(
            "DUOMUSIC_CORS_ORIGINS",
            '["http://localhost:4200","https://meusite.com"]',
        )
        settings = Settings()
        assert "https://meusite.com" in settings.cors_origins

    def test_llm_temperature_via_env(self, monkeypatch):
        monkeypatch.setenv("DUOMUSIC_LLM_TEMPERATURE", "0.3")
        settings = Settings()
        assert settings.llm_temperature == pytest.approx(0.3)


class TestGetSettings:
    """Testes para o factory com cache."""

    def test_retorna_instancia_de_settings(self):
        settings = get_settings()
        assert isinstance(settings, Settings)

    def test_cache_retorna_mesma_instancia(self):
        s1 = get_settings()
        s2 = get_settings()
        assert s1 is s2

    def test_cache_limpo_retorna_nova_instancia(self):
        s1 = get_settings()
        get_settings.cache_clear()
        s2 = get_settings()
        # São instâncias diferentes após limpar o cache
        assert s1 is not s2
