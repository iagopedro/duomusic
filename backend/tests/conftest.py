"""Configuração global de testes pytest."""

import pytest

from app.config import get_settings


@pytest.fixture(autouse=True)
def reset_settings_cache():
    """Limpa o cache de settings antes de cada teste para garantir isolamento."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
