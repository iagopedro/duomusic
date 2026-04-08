from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação carregadas de variáveis de ambiente."""

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:4200"]

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

    model_config = {"env_prefix": "DUOMUSIC_", "env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
