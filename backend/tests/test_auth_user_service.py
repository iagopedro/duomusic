"""Testes para o serviço de usuários."""

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio

from app.auth.password import hash_password
from app.auth.schemas import UserCreate, UserUpdate
from app.models.db_user import User
from app.services.user_service import UserService


class TestCreateUser:
    """Testes para o método create_user."""

    @pytest.mark.asyncio
    async def test_salva_usuario_no_banco(self, async_db):
        """3.1 - Cria usuário no banco."""
        service = UserService(async_db)
        user_data = UserCreate(email="novo@email.com", password="senha12345")

        user = await service.create_user(user_data)
        await async_db.commit()

        assert user is not None
        assert user.email == "novo@email.com"

    @pytest.mark.asyncio
    async def test_retorna_user_sem_password(self, async_db):
        """3.2 - Não expõe hashed_password no retorno (verifica que existe)."""
        service = UserService(async_db)
        user_data = UserCreate(email="test@email.com", password="senha12345")

        user = await service.create_user(user_data)

        # O model User tem hashed_password, mas não deve ser a senha original
        assert user.hashed_password != "senha12345"
        assert user.hashed_password.startswith("$2b$")  # bcrypt prefix

    @pytest.mark.asyncio
    async def test_gera_uuid_automaticamente(self, async_db):
        """3.3 - UUID é gerado automaticamente."""
        service = UserService(async_db)
        user_data = UserCreate(email="uuid@email.com", password="senha12345")

        user = await service.create_user(user_data)

        assert user.id is not None
        assert len(user.id) == 36  # formato UUID

    @pytest.mark.asyncio
    async def test_erro_para_email_duplicado(self, async_db):
        """3.4 - Erro ao tentar criar com email duplicado."""
        service = UserService(async_db)
        user_data = UserCreate(email="dup@email.com", password="senha12345")

        await service.create_user(user_data)
        await async_db.commit()

        with pytest.raises(ValueError, match="Email already registered"):
            await service.create_user(user_data)

    @pytest.mark.asyncio
    async def test_normaliza_email_lowercase(self, async_db):
        """3.5 - Email é normalizado para lowercase."""
        service = UserService(async_db)
        user_data = UserCreate(email="UPPER@EMAIL.COM", password="senha12345")

        user = await service.create_user(user_data)

        assert user.email == "upper@email.com"

    @pytest.mark.asyncio
    async def test_define_created_at(self, async_db):
        """3.6 - created_at é definido automaticamente."""
        service = UserService(async_db)
        user_data = UserCreate(email="time@email.com", password="senha12345")

        before = datetime.now(timezone.utc).replace(microsecond=0)
        user = await service.create_user(user_data)
        after = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(seconds=1)

        assert user.created_at is not None
        # Verifica que está dentro de um intervalo razoável (ignora microsegundos)
        created = user.created_at.replace(tzinfo=timezone.utc, microsecond=0)
        assert before <= created <= after

    @pytest.mark.asyncio
    async def test_is_active_true_por_padrao(self, async_db):
        """3.7 - is_active é True por padrão."""
        service = UserService(async_db)
        user_data = UserCreate(email="active@email.com", password="senha12345")

        user = await service.create_user(user_data)

        assert user.is_active is True

    @pytest.mark.asyncio
    async def test_aceita_display_name_opcional(self, async_db):
        """3.8 - display_name é opcional."""
        service = UserService(async_db)

        # Sem display_name
        user1 = await service.create_user(
            UserCreate(email="no-name@email.com", password="senha12345")
        )
        assert user1.display_name is None

        # Com display_name
        user2 = await service.create_user(
            UserCreate(
                email="with-name@email.com",
                password="senha12345",
                display_name="João Silva",
            )
        )
        assert user2.display_name == "João Silva"


class TestGetUser:
    """Testes para busca de usuários."""

    @pytest_asyncio.fixture
    async def usuario_existente(self, async_db):
        """Cria um usuário de teste."""
        service = UserService(async_db)
        user = await service.create_user(
            UserCreate(email="existente@email.com", password="senha12345")
        )
        await async_db.commit()
        return user

    @pytest.mark.asyncio
    async def test_get_by_id_retorna_user_existente(self, async_db, usuario_existente):
        """3.9 - Busca por ID retorna usuário."""
        service = UserService(async_db)

        user = await service.get_by_id(usuario_existente.id)

        assert user is not None
        assert user.id == usuario_existente.id

    @pytest.mark.asyncio
    async def test_get_by_id_retorna_none_para_inexistente(self, async_db):
        """3.10 - Busca por ID inexistente retorna None."""
        service = UserService(async_db)

        user = await service.get_by_id("id-que-nao-existe")

        assert user is None

    @pytest.mark.asyncio
    async def test_get_by_email_retorna_user_existente(
        self, async_db, usuario_existente
    ):
        """3.11 - Busca por email retorna usuário."""
        service = UserService(async_db)

        user = await service.get_by_email("existente@email.com")

        assert user is not None
        assert user.email == "existente@email.com"

    @pytest.mark.asyncio
    async def test_get_by_email_retorna_none_para_inexistente(self, async_db):
        """3.12 - Busca por email inexistente retorna None."""
        service = UserService(async_db)

        user = await service.get_by_email("naoexiste@email.com")

        assert user is None

    @pytest.mark.asyncio
    async def test_get_by_email_case_insensitive(self, async_db, usuario_existente):
        """3.13 - Busca por email é case-insensitive."""
        service = UserService(async_db)

        user = await service.get_by_email("EXISTENTE@EMAIL.COM")

        assert user is not None
        assert user.email == "existente@email.com"


class TestAuthenticate:
    """Testes para autenticação."""

    @pytest_asyncio.fixture
    async def usuario_para_auth(self, async_db):
        """Cria um usuário para testes de autenticação."""
        service = UserService(async_db)
        user = await service.create_user(
            UserCreate(email="auth@email.com", password="senha_correta_123")
        )
        await async_db.commit()
        return user

    @pytest.mark.asyncio
    async def test_retorna_user_para_credenciais_validas(
        self, async_db, usuario_para_auth
    ):
        """3.14 - Autenticação com credenciais válidas."""
        service = UserService(async_db)

        user = await service.authenticate("auth@email.com", "senha_correta_123")

        assert user is not None
        assert user.email == "auth@email.com"

    @pytest.mark.asyncio
    async def test_retorna_none_para_email_inexistente(self, async_db):
        """3.15 - Autenticação com email inexistente."""
        service = UserService(async_db)

        user = await service.authenticate("naoexiste@email.com", "qualquer_senha")

        assert user is None

    @pytest.mark.asyncio
    async def test_retorna_none_para_senha_incorreta(
        self, async_db, usuario_para_auth
    ):
        """3.16 - Autenticação com senha incorreta."""
        service = UserService(async_db)

        user = await service.authenticate("auth@email.com", "senha_errada")

        assert user is None

    @pytest.mark.asyncio
    async def test_atualiza_last_login_at(self, async_db, usuario_para_auth):
        """3.17 - Autenticação atualiza last_login_at."""
        service = UserService(async_db)
        before = datetime.now(timezone.utc)

        user = await service.authenticate("auth@email.com", "senha_correta_123")
        await async_db.commit()

        assert user.last_login_at is not None
        assert user.last_login_at.replace(tzinfo=timezone.utc) >= before

    @pytest.mark.asyncio
    async def test_retorna_none_para_user_inativo(self, async_db, usuario_para_auth):
        """3.18 - Autenticação falha para usuário inativo."""
        service = UserService(async_db)

        # Desativa o usuário
        await service.deactivate_user(usuario_para_auth)
        await async_db.commit()

        user = await service.authenticate("auth@email.com", "senha_correta_123")

        assert user is None


class TestUpdateUser:
    """Testes para atualização de usuários."""

    @pytest_asyncio.fixture
    async def usuario_para_update(self, async_db):
        """Cria um usuário para testes de atualização."""
        service = UserService(async_db)
        user = await service.create_user(
            UserCreate(
                email="update@email.com",
                password="senha12345",
                display_name="Nome Original",
            )
        )
        await async_db.commit()
        return user

    @pytest.mark.asyncio
    async def test_altera_display_name(self, async_db, usuario_para_update):
        """3.19 - Atualiza display_name."""
        service = UserService(async_db)
        update_data = UserUpdate(display_name="Nome Atualizado")

        updated = await service.update_user(usuario_para_update, update_data)

        assert updated.display_name == "Nome Atualizado"


class TestDeactivateUser:
    """Testes para desativação de usuários."""

    @pytest_asyncio.fixture
    async def usuario_para_desativar(self, async_db):
        """Cria um usuário para testes de desativação."""
        service = UserService(async_db)
        user = await service.create_user(
            UserCreate(email="deactivate@email.com", password="senha12345")
        )
        await async_db.commit()
        return user

    @pytest.mark.asyncio
    async def test_marca_is_active_false(self, async_db, usuario_para_desativar):
        """3.21 - Desativação marca is_active como False."""
        service = UserService(async_db)

        await service.deactivate_user(usuario_para_desativar)
        await async_db.commit()

        # Busca novamente para verificar
        user = await service.get_by_id(usuario_para_desativar.id)
        assert user.is_active is False


class TestRefreshTokens:
    """Testes para gerenciamento de refresh tokens."""

    @pytest_asyncio.fixture
    async def usuario_com_token(self, async_db):
        """Cria um usuário com refresh token."""
        service = UserService(async_db)
        user = await service.create_user(
            UserCreate(email="token@email.com", password="senha12345")
        )
        await async_db.commit()
        return user

    @pytest.mark.asyncio
    async def test_store_refresh_token(self, async_db, usuario_com_token):
        """Armazena refresh token."""
        service = UserService(async_db)
        token = "token-de-teste-123"
        expires = datetime.now(timezone.utc) + timedelta(days=7)

        refresh_token = await service.store_refresh_token(
            usuario_com_token.id, token, expires
        )
        await async_db.commit()

        assert refresh_token is not None
        assert refresh_token.user_id == usuario_com_token.id
        assert refresh_token.revoked is False

    @pytest.mark.asyncio
    async def test_validate_refresh_token_valido(self, async_db, usuario_com_token):
        """Valida refresh token válido."""
        service = UserService(async_db)
        token = "token-valido-456"
        expires = datetime.now(timezone.utc) + timedelta(days=7)

        await service.store_refresh_token(usuario_com_token.id, token, expires)
        await async_db.commit()

        stored = await service.validate_refresh_token(token)
        assert stored is not None

    @pytest.mark.asyncio
    async def test_validate_refresh_token_revogado(self, async_db, usuario_com_token):
        """Rejeita refresh token revogado."""
        service = UserService(async_db)
        token = "token-revogado-789"
        expires = datetime.now(timezone.utc) + timedelta(days=7)

        await service.store_refresh_token(usuario_com_token.id, token, expires)
        await service.revoke_refresh_token(token)
        await async_db.commit()

        stored = await service.validate_refresh_token(token)
        assert stored is None

    @pytest.mark.asyncio
    async def test_revoke_refresh_token(self, async_db, usuario_com_token):
        """Revoga refresh token."""
        service = UserService(async_db)
        token = "token-para-revogar"
        expires = datetime.now(timezone.utc) + timedelta(days=7)

        await service.store_refresh_token(usuario_com_token.id, token, expires)
        await async_db.commit()

        result = await service.revoke_refresh_token(token)
        assert result is True

    @pytest.mark.asyncio
    async def test_revoke_all_user_tokens(self, async_db, usuario_com_token):
        """Revoga todos os tokens do usuário."""
        service = UserService(async_db)
        expires = datetime.now(timezone.utc) + timedelta(days=7)

        # Cria múltiplos tokens
        await service.store_refresh_token(usuario_com_token.id, "token-1", expires)
        await service.store_refresh_token(usuario_com_token.id, "token-2", expires)
        await async_db.commit()

        count = await service.revoke_all_user_tokens(usuario_com_token.id)
        await async_db.commit()

        assert count == 2

        # Verifica que ambos foram revogados
        assert await service.validate_refresh_token("token-1") is None
        assert await service.validate_refresh_token("token-2") is None
