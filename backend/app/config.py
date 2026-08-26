from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# Caminho absoluto para o .env — independente de onde o uvicorn é iniciado
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    """Configurações da aplicação carregadas de variáveis de ambiente."""

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:4200"]

    # Database — URL async (aiosqlite para SQLite, asyncpg para PostgreSQL)
    database_url: str = "sqlite+aiosqlite:///./duomusic.db"

    # JWT
    jwt_secret_key: str = "dev-secret-change-in-production-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # LLM
    llm_enabled: bool = False
    llm_provider: str = "gemini"
    llm_api_key: str = ""
    llm_model: str = "gemini-2.0-flash"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048

    # Rate limiting
    rate_limit_max: int = 60
    rate_limit_window: int = 60

    model_config = {"env_prefix": "DUOMUSIC_", "env_file": str(_ENV_FILE)}


@lru_cache
def get_settings() -> Settings:
    return Settings()
