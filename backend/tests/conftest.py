"""Configuração global de testes pytest."""

import asyncio
from collections.abc import AsyncGenerator
from typing import Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.database import Base, get_db
from app.main import app


@pytest.fixture(autouse=True)
def reset_settings_cache():
    """Limpa o cache de settings antes de cada teste para garantir isolamento."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


# ----- Database fixtures para testes de auth -----

# Engine de teste em memória
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Cria um event loop para a sessão de testes."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Fixture que fornece uma sessão de banco de dados para testes.
    Cria as tabelas antes e faz rollback depois.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def auth_client(async_db: AsyncSession):
    """
    TestClient com override de get_db para usar banco de teste.
    Usa httpx com AsyncClient para lidar com endpoints async.
    """

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield async_db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
