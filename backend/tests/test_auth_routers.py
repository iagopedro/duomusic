"""Testes de integração para os routers de autenticação."""

import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


# Engine de teste em memória para esses testes
_test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

_TestSessionLocal = async_sessionmaker(
    _test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
def cliente_auth():
    """TestClient com banco de teste em memória."""

    async def setup_db():
        async with _test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def teardown_db():
        async with _test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    # Cria as tabelas
    loop = asyncio.new_event_loop()
    loop.run_until_complete(setup_db())

    async def override_get_db():
        async with _TestSessionLocal() as session:
            yield session
            await session.commit()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()

    # Remove as tabelas
    loop.run_until_complete(teardown_db())
    loop.close()


class TestRegisterEndpoint:
    """Testes para POST /auth/register."""

    def test_retorna_201_para_dados_validos(self, cliente_auth):
        """4.1 - Registro com dados válidos retorna 201."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "novo@email.com",
                "password": "senha12345",
            },
        )
        assert resp.status_code == 201

    def test_retorna_tokens(self, cliente_auth):
        """4.2 - Registro retorna access_token e refresh_token."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "tokens@email.com",
                "password": "senha12345",
            },
        )
        data = resp.json()

        assert "accessToken" in data
        assert "refreshToken" in data
        assert data["tokenType"] == "bearer"
        assert "expiresIn" in data

    def test_retorna_422_para_email_invalido(self, cliente_auth):
        """4.4 - Email inválido retorna 422."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "email-invalido",
                "password": "senha12345",
            },
        )
        assert resp.status_code == 422

    def test_retorna_422_para_senha_curta(self, cliente_auth):
        """4.5 - Senha menor que 8 chars retorna 422."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "short@email.com",
                "password": "1234567",  # 7 chars
            },
        )
        assert resp.status_code == 422

    def test_retorna_409_para_email_duplicado(self, cliente_auth):
        """4.6 - Email duplicado retorna 409."""
        # Primeiro registro
        cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "dup@email.com",
                "password": "senha12345",
            },
        )

        # Segundo registro com mesmo email
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "dup@email.com",
                "password": "outra_senha_123",
            },
        )
        assert resp.status_code == 409

    def test_retorna_422_para_campos_faltando(self, cliente_auth):
        """4.7 - Campos obrigatórios faltando retorna 422."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "missing@email.com",
                # password faltando
            },
        )
        assert resp.status_code == 422

    def test_retorna_422_para_senha_longa(self, cliente_auth):
        """4.8 - Senha maior que 128 chars retorna 422."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "long@email.com",
                "password": "a" * 129,
            },
        )
        assert resp.status_code == 422

    def test_display_name_opcional(self, cliente_auth):
        """4.9 - display_name é opcional."""
        # Sem display_name
        resp1 = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "no-name@email.com",
                "password": "senha12345",
            },
        )
        assert resp1.status_code == 201

        # Com display_name
        resp2 = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "with-name@email.com",
                "password": "senha12345",
                "displayName": "João Silva",
            },
        )
        assert resp2.status_code == 201


class TestLoginEndpoint:
    """Testes para POST /auth/login (OAuth2) e /auth/login/json."""

    @pytest.fixture(autouse=True)
    def criar_usuario(self, cliente_auth):
        """Cria um usuário para testes de login."""
        cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "login@email.com",
                "password": "senha_login_123",
            },
        )

    def test_retorna_200_para_credenciais_validas(self, cliente_auth):
        """4.10 - Login com credenciais válidas retorna 200."""
        resp = cliente_auth.post(
            "/api/auth/login",
            data={
                "username": "login@email.com",
                "password": "senha_login_123",
            },
        )
        assert resp.status_code == 200

    def test_retorna_tokens(self, cliente_auth):
        """4.11 - Login retorna access_token e refresh_token."""
        resp = cliente_auth.post(
            "/api/auth/login",
            data={
                "username": "login@email.com",
                "password": "senha_login_123",
            },
        )
        data = resp.json()

        assert "accessToken" in data
        assert "refreshToken" in data

    def test_retorna_401_para_email_inexistente(self, cliente_auth):
        """4.12 - Email inexistente retorna 401."""
        resp = cliente_auth.post(
            "/api/auth/login",
            data={
                "username": "naoexiste@email.com",
                "password": "qualquer_senha",
            },
        )
        assert resp.status_code == 401

    def test_retorna_401_para_senha_incorreta(self, cliente_auth):
        """4.13 - Senha incorreta retorna 401."""
        resp = cliente_auth.post(
            "/api/auth/login",
            data={
                "username": "login@email.com",
                "password": "senha_errada",
            },
        )
        assert resp.status_code == 401

    def test_login_json_funciona(self, cliente_auth):
        """Login via JSON funciona."""
        resp = cliente_auth.post(
            "/api/auth/login/json",
            json={
                "email": "login@email.com",
                "password": "senha_login_123",
            },
        )
        assert resp.status_code == 200
        assert "accessToken" in resp.json()


class TestRefreshEndpoint:
    """Testes para POST /auth/refresh."""

    @pytest.fixture
    def tokens_validos(self, cliente_auth):
        """Registra usuário e retorna tokens."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "refresh@email.com",
                "password": "senha12345",
            },
        )
        return resp.json()

    def test_retorna_novo_access_token(self, cliente_auth, tokens_validos):
        """4.17 - Refresh retorna novo access_token."""
        resp = cliente_auth.post(
            "/api/auth/refresh",
            json={"refreshToken": tokens_validos["refreshToken"]},
        )
        assert resp.status_code == 200
        assert "accessToken" in resp.json()

    def test_retorna_401_para_refresh_invalido(self, cliente_auth):
        """4.20 - Refresh token inválido retorna 401."""
        resp = cliente_auth.post(
            "/api/auth/refresh",
            json={"refreshToken": "token-invalido"},
        )
        assert resp.status_code == 401

    def test_rotaciona_refresh_token(self, cliente_auth, tokens_validos):
        """4.21 - Refresh rotaciona o token."""
        resp = cliente_auth.post(
            "/api/auth/refresh",
            json={"refreshToken": tokens_validos["refreshToken"]},
        )
        new_tokens = resp.json()

        # Novo refresh token é diferente do antigo
        assert new_tokens["refreshToken"] != tokens_validos["refreshToken"]

        # Token antigo não funciona mais
        resp2 = cliente_auth.post(
            "/api/auth/refresh",
            json={"refreshToken": tokens_validos["refreshToken"]},
        )
        assert resp2.status_code == 401


class TestLogoutEndpoint:
    """Testes para POST /auth/logout."""

    @pytest.fixture
    def usuario_logado(self, cliente_auth):
        """Registra usuário e retorna tokens."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "logout@email.com",
                "password": "senha12345",
            },
        )
        return resp.json()

    def test_retorna_204(self, cliente_auth, usuario_logado):
        """4.23 - Logout retorna 204."""
        resp = cliente_auth.post(
            "/api/auth/logout",
            json={"refreshToken": usuario_logado["refreshToken"]},
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        assert resp.status_code == 204

    def test_requer_autenticacao(self, cliente_auth, usuario_logado):
        """4.24 - Logout requer autenticação."""
        resp = cliente_auth.post(
            "/api/auth/logout",
            json={"refreshToken": usuario_logado["refreshToken"]},
        )
        assert resp.status_code == 401


class TestMeEndpoint:
    """Testes para GET /auth/me."""

    @pytest.fixture
    def usuario_logado(self, cliente_auth):
        """Registra usuário e retorna tokens."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "me@email.com",
                "password": "senha12345",
                "displayName": "Test User",
            },
        )
        return resp.json()

    def test_retorna_dados_do_usuario(self, cliente_auth, usuario_logado):
        """4.25 - GET /me retorna dados do usuário."""
        resp = cliente_auth.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "me@email.com"
        assert data["displayName"] == "Test User"

    def test_retorna_401_sem_token(self, cliente_auth):
        """4.26 - GET /me sem token retorna 401."""
        resp = cliente_auth.get("/api/auth/me")
        assert resp.status_code == 401

    def test_nao_retorna_hashed_password(self, cliente_auth, usuario_logado):
        """4.28 - Resposta não contém hashed_password."""
        resp = cliente_auth.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        data = resp.json()
        assert "hashedPassword" not in data
        assert "hashed_password" not in data


class TestUpdateMeEndpoint:
    """Testes para PUT /auth/me."""

    @pytest.fixture
    def usuario_logado(self, cliente_auth):
        """Registra usuário e retorna tokens."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "update-me@email.com",
                "password": "senha12345",
            },
        )
        return resp.json()

    def test_atualiza_display_name(self, cliente_auth, usuario_logado):
        """4.29 - PUT /me atualiza display_name."""
        resp = cliente_auth.put(
            "/api/auth/me",
            json={"displayName": "Novo Nome"},
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        assert resp.status_code == 200
        assert resp.json()["displayName"] == "Novo Nome"

    def test_retorna_422_para_display_name_longo(self, cliente_auth, usuario_logado):
        """4.30 - display_name maior que 50 chars retorna 422."""
        resp = cliente_auth.put(
            "/api/auth/me",
            json={"displayName": "a" * 51},
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        assert resp.status_code == 422

    def test_requer_autenticacao(self, cliente_auth):
        """4.31 - PUT /me requer autenticação."""
        resp = cliente_auth.put(
            "/api/auth/me",
            json={"displayName": "Test"},
        )
        assert resp.status_code == 401


class TestDeleteMeEndpoint:
    """Testes para DELETE /auth/me."""

    @pytest.fixture
    def usuario_logado(self, cliente_auth):
        """Registra usuário e retorna tokens."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "delete-me@email.com",
                "password": "senha12345",
            },
        )
        return resp.json()

    def test_retorna_204(self, cliente_auth, usuario_logado):
        """4.33 - DELETE /me retorna 204."""
        resp = cliente_auth.delete(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )
        assert resp.status_code == 204

    def test_requer_autenticacao(self, cliente_auth):
        """4.34 - DELETE /me requer autenticação."""
        resp = cliente_auth.delete("/api/auth/me")
        assert resp.status_code == 401

    def test_usuario_nao_consegue_logar_apos_delete(self, cliente_auth, usuario_logado):
        """4.32 - Usuário desativado não consegue logar."""
        # Deleta a conta
        cliente_auth.delete(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {usuario_logado['accessToken']}"},
        )

        # Tenta logar novamente
        resp = cliente_auth.post(
            "/api/auth/login",
            data={
                "username": "delete-me@email.com",
                "password": "senha12345",
            },
        )
        assert resp.status_code == 401


class TestCamelCaseResponses:
    """Testes para garantir que as respostas usam camelCase."""

    def test_token_response_usa_camel_case(self, cliente_auth):
        """Resposta de token usa camelCase."""
        resp = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "camel@email.com",
                "password": "senha12345",
            },
        )
        data = resp.json()

        # camelCase
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "tokenType" in data
        assert "expiresIn" in data

        # snake_case não deve existir
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert "token_type" not in data
        assert "expires_in" not in data

    def test_user_response_usa_camel_case(self, cliente_auth):
        """Resposta de usuário usa camelCase."""
        # Registra
        tokens = cliente_auth.post(
            "/api/auth/register",
            json={
                "email": "camel-user@email.com",
                "password": "senha12345",
                "displayName": "Test",
            },
        ).json()

        # Busca usuário
        resp = cliente_auth.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {tokens['accessToken']}"},
        )
        data = resp.json()

        # camelCase
        assert "displayName" in data
        assert "createdAt" in data

        # snake_case não deve existir
        assert "display_name" not in data
        assert "created_at" not in data
